// The EMIT phase: turn the planning phase's plan (edits + import/mapping
// bookkeeping) into the generated code plus the source↔generated SEGMENTS, and the
// two utilities that consume those segments (source→generated lookup, and the
// conversion into Volar's CodeMapping format). Pure with respect to the transform's
// checker state — it only ever sees the plan and the original text.
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.assembleOutput = assembleOutput;
exports.mapSourceToGenerated = mapSourceToGenerated;
exports.segmentsToVolarMappings = segmentsToVolarMappings;
const transform_program_cjs_1 = require("./transform-program.cjs");
// Splice the planned edits over the source to produce the generated code, and
// record the source↔generated SEGMENTS as we go.
function assembleOutput({ ts, sf, sourceText, baseDir, edits, needed, usedRender, declMappings, rootMappings }) {
    // First generated position recorded per alias/root key, so the destructured-
    // field declaration sites (D4) and single-root occurrences (D5) can map onto
    // the `item.prop` / outer-stream token their first use emitted.
    const aliasGenTarget = new Map();
    // Names already imported per module — so we don't import a name twice. We do
    // NOT modify the existing import statements: leaving them intact keeps full TS
    // features (hover, go-to-def) on them via their identity mappings. The extra
    // names we need go in a separate generated-only import line at the top (two
    // imports from the same module is legal as long as names don't collide).
    const alreadyImported = (mod) => {
        const names = new Set();
        for (const s of sf.statements) {
            if (ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.moduleSpecifier.text === mod) {
                const nb = s.importClause && s.importClause.namedBindings;
                if (nb && ts.isNamedImports(nb))
                    for (const el of nb.elements)
                        names.add(el.name.text);
            }
        }
        return names;
    };
    const newNames = (mod, set) => [...set].filter(n => !alreadyImported(mod).has(n));
    const importLines = [];
    if (usedRender)
        importLines.push(`import { render } from "${(0, transform_program_cjs_1.relativeRuntimeSpecifier)(baseDir)}";`);
    const rxjsNew = newNames('rxjs', needed.rxjs);
    if (rxjsNew.length)
        importLines.push(`import { ${rxjsNew.join(', ')} } from "rxjs";`);
    const opNew = newNames('rxjs/operators', needed['rxjs/operators']);
    if (opNew.length)
        importLines.push(`import { ${opNew.join(', ')} } from "rxjs/operators";`);
    const rxfmNew = newNames('rxfm', needed.rxfm);
    if (rxfmNew.length)
        importLines.push(`import { ${rxfmNew.join(', ')} } from "rxfm";`);
    const importBlock = importLines.length ? importLines.join('\n') + '\n' : '';
    edits.sort((a, b) => a.start - b.start);
    let code = importBlock;
    const segments = [];
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
        for (const piece of edit.pieces) {
            if (typeof piece === 'string') {
                code += piece;
            }
            else if ('gen' in piece) {
                // Generated-only text whose position is recorded as a mapping target (the
                // outer stream reference of a single-root collapse — D5 root hover).
                if (piece.refKey)
                    aliasGenTarget.set(piece.refKey, { genStart: code.length, len: piece.gen.length });
                code += piece.gen;
            }
            else {
                const length = piece.srcEnd - piece.srcStart;
                segments.push({ identity: true, srcStart: piece.srcStart, length, genStart: code.length });
                // First generated `item.prop` token for this field: the declaration borrows it.
                if (piece.aliasKey && !aliasGenTarget.has(piece.aliasKey))
                    aliasGenTarget.set(piece.aliasKey, { genStart: code.length, len: length });
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
        if (target)
            segments.push({ identity: false, navigable: true, srcStart: dm.srcStart, srcLen: dm.len, genStart: target.genStart, genLen: target.len });
    }
    // D5 root hover: each single-root occurrence maps onto its collapse's outer stream
    // reference, so the variable shows its `Observable<…>` type, not the in-map value.
    for (const rm of rootMappings) {
        const target = aliasGenTarget.get(rm.key);
        if (target)
            segments.push({ identity: false, navigable: true, srcStart: rm.srcStart, srcLen: rm.len, genStart: target.genStart, genLen: target.len });
    }
    return { code, segments };
}
function mapSourceToGenerated(segments, srcOffset) {
    for (const seg of segments) {
        if (seg.identity && srcOffset >= seg.srcStart && srcOffset < seg.srcStart + seg.length) {
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
function segmentsToVolarMappings(segments) {
    const full = { completion: true, format: false, navigation: true, semantic: true, structure: true, verification: true };
    const coarse = { completion: false, format: false, navigation: false, semantic: false, structure: false, verification: true };
    const navigable = { completion: false, format: false, navigation: true, semantic: true, structure: false, verification: true };
    const mappings = [];
    for (const seg of segments) {
        if (seg.identity) {
            mappings.push({ sourceOffsets: [seg.srcStart], generatedOffsets: [seg.genStart], lengths: [seg.length], data: full });
        }
        else {
            mappings.push({
                sourceOffsets: [seg.srcStart], generatedOffsets: [seg.genStart],
                lengths: [seg.srcLen], generatedLengths: [seg.genLen], data: seg.navigable ? navigable : coarse,
            });
        }
    }
    return mappings;
}
