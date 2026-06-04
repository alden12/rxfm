// tsrx transform — canonical (CommonJS, injected `ts`).
//
// Takes the TypeScript module + raw .tsrx source text, returns generated TS plus
// position MAPPINGS. Used by the headless harness AND the editor tsserver plugin,
// so the runtime, the CLI, and live editor types all share one implementation.
//
// Inference is checker-driven: we build a throwaway Program from the source text
// to learn which identifiers are observables. The `+`-on-Observable error doesn't
// poison operand types, so leaf detection is reliable; derived bindings are
// tracked ourselves (the propagation table).
'use strict';
const path = require('node:path');

function getCompilerOptions(ts) {
  return {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  };
}

// A Program that serves `text` for `fileName` and reads everything else (libs,
// rxjs) from disk. Lets us type-check an unsaved editor buffer.
function createProgramFromText(ts, fileName, text, options) {
  const host = ts.createCompilerHost(options, true);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, ...rest) =>
    name === fileName
      ? ts.createSourceFile(name, text, languageVersion, true)
      : getSourceFile(name, languageVersion, ...rest);
  host.fileExists = f => (f === fileName ? true : ts.sys.fileExists(f));
  const readFile = host.readFile.bind(host);
  host.readFile = f => (f === fileName ? text : readFile(f));
  return ts.createProgram([fileName], options, host);
}

function transformWithMappings(ts, sourceText, baseDir) {
  const LIFTABLE = {
    [ts.SyntaxKind.PlusToken]: '+',
    [ts.SyntaxKind.MinusToken]: '-',
    [ts.SyntaxKind.AsteriskToken]: '*',
    [ts.SyntaxKind.SlashToken]: '/',
  };

  const fileName = path.join(baseDir, '__tsrx_virtual__.ts');
  const options = getCompilerOptions(ts);
  const program = createProgramFromText(ts, fileName, sourceText, options);
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(fileName);

  const observableBindings = new Set();
  const needed = { rxjs: new Set(), 'rxjs/operators': new Set() };
  const edits = [];

  const isObservableType = type => {
    if (!type) return false;
    if (type.isUnion && type.isUnion()) return type.types.some(isObservableType);
    return Boolean(type.getProperty && type.getProperty('subscribe') && type.getProperty('pipe'));
  };
  const isObservableExpr = node =>
    (ts.isIdentifier(node) && observableBindings.has(node.text)) ||
    isObservableType(checker.getTypeAtLocation(node));

  function transformExpression(node) {
    if (ts.isParenthesizedExpression(node)) {
      const inner = transformExpression(node.expression);
      return inner.lifted
        ? { text: inner.text, observable: true, lifted: true }
        : { text: node.getText(sf), observable: inner.observable, lifted: false };
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind in LIFTABLE) {
      const left = transformExpression(node.left);
      const right = transformExpression(node.right);
      if (left.observable || right.observable) {
        needed.rxjs.add('combineLatest');
        needed['rxjs/operators'].add('map');
        const used = new Set();
        const paramOf = (operandNode, i) => {
          let base = ts.isIdentifier(operandNode) ? operandNode.text : `_${i}`;
          let name = base, n = 1;
          while (used.has(name)) name = `${base}_${n++}`;
          used.add(name);
          return name;
        };
        const params = [paramOf(node.left, 0), paramOf(node.right, 1)];
        const sources = [left, right].map(o => {
          if (o.observable) return o.text;
          needed.rxjs.add('of');
          return `of(${o.text})`;
        });
        const op = LIFTABLE[node.operatorToken.kind];
        const text =
          `combineLatest([${sources.join(', ')}])` +
          `.pipe(map(([${params.join(', ')}]) => ${params[0]} ${op} ${params[1]}))`;
        return { text, observable: true, lifted: true };
      }
      return { text: node.getText(sf), observable: false, lifted: false };
    }
    return { text: node.getText(sf), observable: isObservableExpr(node), lifted: false };
  }

  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!decl.initializer) continue;
      const r = transformExpression(decl.initializer);
      if (r.observable && ts.isIdentifier(decl.name)) observableBindings.add(decl.name.text);
      if (r.lifted) edits.push({ start: decl.initializer.getStart(sf), end: decl.initializer.getEnd(), replacement: r.text });
    }
  }

  // Names already imported per module — so we don't import a name twice. We do
  // NOT modify the existing import statements: leaving them intact keeps full TS
  // features (hover, go-to-def) on them via their identity mappings. The extra
  // names we need go in a separate generated-only import line at the top (two
  // imports from the same module is legal as long as names don't collide).
  const alreadyImported = mod => {
    const names = new Set();
    for (const s of sf.statements) {
      if (ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.moduleSpecifier.text === mod) {
        const nb = s.importClause && s.importClause.namedBindings;
        if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) names.add(el.name.text);
      }
    }
    return names;
  };
  const newNames = (mod, set) => [...set].filter(n => !alreadyImported(mod).has(n));
  const importLines = [];
  const rxjsNew = newNames('rxjs', needed.rxjs);
  if (rxjsNew.length) importLines.push(`import { ${rxjsNew.join(', ')} } from "rxjs";`);
  const opNew = newNames('rxjs/operators', needed['rxjs/operators']);
  if (opNew.length) importLines.push(`import { ${opNew.join(', ')} } from "rxjs/operators";`);
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
    segments.push({ identity: false, srcStart: edit.start, srcLen: edit.end - edit.start, genStart: code.length, genLen: edit.replacement.length });
    code += edit.replacement;
    cursor = edit.end;
  }
  if (cursor < sourceText.length) {
    segments.push({ identity: true, srcStart: cursor, length: sourceText.length - cursor, genStart: code.length });
    code += sourceText.slice(cursor);
  }

  const sourceDiagnostics = ts.getPreEmitDiagnostics(program).filter(d => d.file && d.file.fileName === fileName);
  return { code, segments, sourceDiagnostics };
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
function segmentsToVolarMappings(segments) {
  const all = { completion: true, format: false, navigation: true, semantic: true, structure: true, verification: true };
  const mappings = [];
  for (const seg of segments) {
    if (seg.identity) {
      mappings.push({ sourceOffsets: [seg.srcStart], generatedOffsets: [seg.genStart], lengths: [seg.length], data: all });
    } else {
      // Rewritten span: map the whole source span onto the whole generated span.
      mappings.push({
        sourceOffsets: [seg.srcStart], generatedOffsets: [seg.genStart],
        lengths: [seg.srcLen], generatedLengths: [seg.genLen], data: all,
      });
    }
  }
  return mappings;
}

module.exports = { transformWithMappings, mapSourceToGenerated, segmentsToVolarMappings, getCompilerOptions };
