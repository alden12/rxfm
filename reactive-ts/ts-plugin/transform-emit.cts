// The EMIT phase: turn the planning phase's plan (edits + import/mapping
// bookkeeping) into the generated code plus the source↔generated SEGMENTS, and the
// two utilities that consume those segments (source→generated lookup, and the
// conversion into Volar's CodeMapping format). Pure with respect to the transform's
// checker state — it only ever sees the plan and the original text.
'use strict';
import type * as TS from 'typescript';
import type { Ts, Edit, Segment, GenTarget, DeclMapping, RootMapping } from './transform-types.cjs';
import { relativeRuntimeSpecifier } from './transform-program.cjs';

/** Inputs the emit phase needs from the planning phase. */
export interface AssembleInput {
  ts: Ts;
  sf: TS.SourceFile;
  sourceText: string;
  baseDir: string;
  edits: Edit[];
  needed: { rxjs: Set<string>; 'rxjs/operators': Set<string>; rxfm: Set<string> };
  usedRender: boolean;
  declMappings: DeclMapping[];
  rootMappings: RootMapping[];
}

// Splice the planned edits over the source to produce the generated code, and
// record the source↔generated SEGMENTS as we go.
export function assembleOutput(
  { ts, sf, sourceText, baseDir, edits, needed, usedRender, declMappings, rootMappings }: AssembleInput,
): { code: string; segments: Segment[] } {
  // First generated position recorded per alias/root key, so the destructured-
  // field declaration sites (D4) and single-root occurrences (D5) can map onto
  // the `item.prop` / outer-stream token their first use emitted.
  const aliasGenTarget = new Map<string, GenTarget>();

  // The source's first VALUE named-import declaration for a module — the statement
  // we fold our extra names into (see foldOrLine). Type-only clauses are skipped:
  // the names we add are used as values.
  const namedImportTarget = (mod: string): TS.NamedImports | undefined => {
    for (const s of sf.statements) {
      if (ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.moduleSpecifier.text === mod) {
        const ic = s.importClause;
        if (ic && !ic.isTypeOnly && ic.namedBindings && ts.isNamedImports(ic.namedBindings)) return ic.namedBindings;
      }
    }
    return undefined;
  };
  // Names already imported per module — so we don't import a name twice.
  const alreadyImported = (mod: string) => {
    const names = new Set<string>();
    for (const s of sf.statements) {
      if (ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.moduleSpecifier.text === mod) {
        const nb = s.importClause && s.importClause.namedBindings;
        if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) names.add(el.name.text);
      }
    }
    return names;
  };
  const newNames = (mod: string, set: Set<string>) => [...set].filter(n => !alreadyImported(mod).has(n));
  const importLines: string[] = [];
  if (usedRender) importLines.push(`import { render } from "${relativeRuntimeSpecifier(baseDir)}";`);
  // Fold the names we need from a module into the source's EXISTING named import for
  // it — an edit splicing `, name` in before the closing brace — rather than emitting
  // a separate generated import line. Why: a separate injected `import { … } from
  // "rxjs"` sits in the generated-only preamble, BEFORE the source's own import. The
  // editor's auto-import merges a new symbol into the FIRST import for the module —
  // the injected one — and that edit lands in generated-only territory Volar can't map
  // back to the .rts, so it's silently dropped (the "Update import" fix appears but
  // does nothing). Folding keeps a single, source-anchored import per module, so the
  // merge targets it and maps back. Only modules the source doesn't already import
  // (and the runtime `render`) still need a separate generated line.
  const foldOrLine = (mod: string, set: Set<string>) => {
    const names = newNames(mod, set);
    if (!names.length) return;
    const target = namedImportTarget(mod);
    if (target && target.elements.length) {
      const at = target.elements[target.elements.length - 1].getEnd();
      edits.push({ start: at, end: at, pieces: [`, ${names.join(', ')}`] });
    } else {
      importLines.push(`import { ${names.join(', ')} } from "${mod}";`);
    }
  };
  foldOrLine('rxjs', needed.rxjs);
  foldOrLine('rxjs/operators', needed['rxjs/operators']);
  foldOrLine('rxfm', needed.rxfm);
  const importBlock = importLines.length ? importLines.join('\n') + '\n' : '';

  edits.sort((a, b) => a.start - b.start);
  let code = importBlock;
  const segments: Segment[] = [];
  let cursor = 0;
  for (const edit of edits) {
    if (edit.start > cursor) {
      segments.push({ identity: true, srcStart: cursor, length: edit.start - cursor, genStart: code.length });
      code += sourceText.slice(cursor, edit.start);
    }
    if (edit.remap !== undefined) {
      // A source token mapped onto different generated text (e.g. `map` →
      // `mapToComponents`). Navigable coarse mapping so hover/go-to-def land on
      // the generated symbol; safe from smear since it's one token ↔ one token.
      segments.push({ identity: false, navigable: true, srcStart: edit.start, srcLen: edit.end - edit.start, genStart: code.length, genLen: edit.remap.length });
      code += edit.remap;
      cursor = edit.end;
      continue;
    }
    // Emit the rewritten initializer piece-by-piece: verbatim source slices get
    // 1:1 identity segments (full language features); synthetic scaffolding is
    // appended as generated-only text with no mapping.
    for (const piece of edit.pieces!) {
      if (typeof piece === 'string') {
        code += piece;
      } else if ('gen' in piece) {
        // Generated-only text whose position is recorded as a mapping target (the
        // outer stream reference of a single-root collapse — D5 root hover).
        if (piece.refKey) aliasGenTarget.set(piece.refKey, { genStart: code.length, len: piece.gen.length });
        code += piece.gen;
      } else {
        const length = piece.srcEnd - piece.srcStart;
        segments.push({ identity: true, srcStart: piece.srcStart, length, genStart: code.length });
        // First generated `item.prop` token for this field: the declaration borrows it.
        if (piece.aliasKey && !aliasGenTarget.has(piece.aliasKey)) aliasGenTarget.set(piece.aliasKey, { genStart: code.length, len: length });
        code += sourceText.slice(piece.srcStart, piece.srcEnd);
      }
    }
    cursor = edit.end;
  }
  if (cursor < sourceText.length) {
    segments.push({ identity: true, srcStart: cursor, length: sourceText.length - cursor, genStart: code.length });
    code += sourceText.slice(cursor);
  }

  // Declaration-site mappings for destructured fields (D4): point each field's
  // binding token at the generated `item.prop` token from its first use, so hover /
  // go-to-def resolve on the binding too. These source spans sit in the erased
  // binding-pattern region (no other segment covers them), so they never overlap.
  for (const dm of declMappings) {
    const target = aliasGenTarget.get(dm.aliasKey);
    if (target) segments.push({ identity: false, navigable: true, srcStart: dm.srcStart, srcLen: dm.len, genStart: target.genStart, genLen: target.len });
  }
  // D5 root hover: each single-root occurrence maps onto its collapse's outer stream
  // reference, so the variable shows its `Observable<…>` type, not the in-map value.
  for (const rm of rootMappings) {
    const target = aliasGenTarget.get(rm.key);
    if (target) segments.push({ identity: false, navigable: true, srcStart: rm.srcStart, srcLen: rm.len, genStart: target.genStart, genLen: target.len });
  }

  return { code, segments };
}

export function mapSourceToGenerated(segments: Segment[], srcOffset: number): number | null {
  for (const seg of segments) {
    if (seg.identity && srcOffset >= seg.srcStart && srcOffset < seg.srcStart + seg.length!) {
      return seg.genStart + (srcOffset - seg.srcStart);
    }
    if (!seg.identity && seg.srcLen != null && srcOffset >= seg.srcStart && srcOffset < seg.srcStart + seg.srcLen) {
      return seg.genStart;
    }
  }
  return null;
}

// Convert our segment table into Volar's CodeMapping[] format.
//
// Identity (1:1) segments — including the verbatim source tokens that survive
// inside a rewritten expression — carry full language features. Synthesized
// scaffolding is generated-only (no segment), so it never maps onto source
// characters: nothing to smear. Non-identity segments map a source span onto
// different generated text: `navigable` ones (a single token → single token,
// e.g. `map` → `mapToComponents`) keep navigation + semantic so hover/go-to-def
// work; the plain `coarse` profile (position-sensitive features off) is a
// defensive fallback for any whole-span remap.
export function segmentsToVolarMappings(segments: Segment[]) {
  const full = { completion: true, format: false, navigation: true, semantic: true, structure: true, verification: true };
  const coarse = { completion: false, format: false, navigation: false, semantic: false, structure: false, verification: true };
  const navigable = { completion: false, format: false, navigation: true, semantic: true, structure: false, verification: true };
  const mappings: any[] = [];
  for (const seg of segments) {
    if (seg.identity) {
      mappings.push({ sourceOffsets: [seg.srcStart], generatedOffsets: [seg.genStart], lengths: [seg.length], data: full });
    } else {
      mappings.push({
        sourceOffsets: [seg.srcStart], generatedOffsets: [seg.genStart],
        lengths: [seg.srcLen], generatedLengths: [seg.genLen], data: seg.navigable ? navigable : coarse,
      });
    }
  }
  return mappings;
}
