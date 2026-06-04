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

// The runtime module the generated code imports `render` from. We emit a
// relative specifier from each .tsrx file's directory so it resolves in both the
// headless harness and the editor.
const RUNTIME_PATH = path.join(__dirname, '..', 'runtime.ts');
function relativeRuntimeSpecifier(baseDir) {
  let rel = path.relative(baseDir, RUNTIME_PATH).replace(/\.ts$/, '').split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

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
  // Binary operators we lift eagerly via combineLatest + map. All emit a
  // primitive (number / boolean / string), so the result is never callable.
  // NOTE: short-circuiting operators (&& || ??) are deliberately absent — they
  // get lazy switchMap handling below, like the ternary.
  const LIFTABLE = {
    [ts.SyntaxKind.PlusToken]: '+',
    [ts.SyntaxKind.MinusToken]: '-',
    [ts.SyntaxKind.AsteriskToken]: '*',
    [ts.SyntaxKind.SlashToken]: '/',
    [ts.SyntaxKind.PercentToken]: '%',
    [ts.SyntaxKind.AsteriskAsteriskToken]: '**',
    // Comparisons → boolean streams (these feed ternary/logical conditions).
    [ts.SyntaxKind.LessThanToken]: '<',
    [ts.SyntaxKind.GreaterThanToken]: '>',
    [ts.SyntaxKind.LessThanEqualsToken]: '<=',
    [ts.SyntaxKind.GreaterThanEqualsToken]: '>=',
    [ts.SyntaxKind.EqualsEqualsEqualsToken]: '===',
    [ts.SyntaxKind.ExclamationEqualsEqualsToken]: '!==',
    [ts.SyntaxKind.EqualsEqualsToken]: '==',
    [ts.SyntaxKind.ExclamationEqualsToken]: '!=',
    // Bitwise → number streams.
    [ts.SyntaxKind.AmpersandToken]: '&',
    [ts.SyntaxKind.BarToken]: '|',
    [ts.SyntaxKind.CaretToken]: '^',
    [ts.SyntaxKind.LessThanLessThanToken]: '<<',
    [ts.SyntaxKind.GreaterThanGreaterThanToken]: '>>',
    [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: '>>>',
  };
  // Prefix unary operators we lift via map. All emit a primitive.
  const LIFTABLE_UNARY = {
    [ts.SyntaxKind.ExclamationToken]: '!',
    [ts.SyntaxKind.MinusToken]: '-',
    [ts.SyntaxKind.PlusToken]: '+',
    [ts.SyntaxKind.TildeToken]: '~',
  };

  const fileName = path.join(baseDir, '__tsrx_virtual__.ts');
  const options = getCompilerOptions(ts);
  const program = createProgramFromText(ts, fileName, sourceText, options);
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(fileName);

  const observableBindings = new Set();
  // Lifted bindings whose emitted value is definitely not callable (e.g. the
  // result of an arithmetic lift). The checker can't tell us this — it analyses
  // the original (pre-transform) source, where these bindings have an erroring/
  // unrelated type — so we record it as we lift. Used to refuse the
  // "observable-emitting-a-function" call lift for them, letting the imperative
  // boundary surface instead (RenderObservable<number> has no call signatures).
  const nonCallableBindings = new Set();
  const needed = { rxjs: new Set(), 'rxjs/operators': new Set() };
  const edits = [];
  let usedRender = false;

  const isObservableType = type => {
    if (!type) return false;
    if (type.isUnion && type.isUnion()) return type.types.some(isObservableType);
    return Boolean(type.getProperty && type.getProperty('subscribe') && type.getProperty('pipe'));
  };
  const isObservableExpr = node =>
    (ts.isIdentifier(node) && observableBindings.has(node.text)) ||
    isObservableType(checker.getTypeAtLocation(node));

  // The value type T of an Observable<T>/RenderObservable<T>, or undefined if the
  // type isn't an observable. Reads the type's first type argument.
  const observableValueType = type => {
    if (!type) return undefined;
    if (type.isUnion && type.isUnion()) {
      for (const t of type.types) {
        const v = observableValueType(t);
        if (v) return v;
      }
      return undefined;
    }
    if (!isObservableType(type)) return undefined;
    let args;
    try { args = checker.getTypeArguments(type); } catch { args = type.typeArguments; }
    return args && args.length ? args[0] : undefined;
  };

  // Would calling this expression be a boundary violation rather than a real
  // "observable emitting a function"? True when the callee is a stream whose
  // emitted value can't be called: a binding we lifted to a non-callable value,
  // or a checker-visible observable whose T has no call signatures.
  const calleeEmitsNonCallable = node => {
    if (ts.isIdentifier(node) && nonCallableBindings.has(node.text)) return true;
    const valueType = observableValueType(checker.getTypeAtLocation(node));
    if (valueType) return checker.getSignaturesOfType(valueType, ts.SignatureKind.Call).length === 0;
    return false;
  };

  const typeIsCallable = type => Boolean(type) && checker.getSignaturesOfType(type, ts.SignatureKind.Call).length > 0;
  // The return type of a callable type's first call signature, or undefined.
  const returnTypeOf = type => {
    const sigs = type ? checker.getSignaturesOfType(type, ts.SignatureKind.Call) : [];
    return sigs.length ? sigs[0].getReturnType() : undefined;
  };

  // Generates unique, readable param names within a single lifted expression.
  const freshNamer = () => {
    const used = new Set();
    return base => {
      let name = base, n = 1;
      while (used.has(name)) name = `${base}_${n++}`;
      used.add(name);
      return name;
    };
  };
  // A transformed expression is a list of "pieces": either a synthetic string
  // (generated scaffolding) or a verbatim slice of the original source
  // { srcStart, srcEnd }. Carrying this provenance lets us map the source tokens
  // that survive into the generated code (identifiers, literals) back 1:1 — so
  // hover / go-to-def / semantic highlighting keep working on them — while the
  // synthesized scaffolding stays generated-only (unmapped).
  const V = node => ({ srcStart: node.getStart(sf), srcEnd: node.getEnd() });
  const piecesText = pieces =>
    pieces.map(p => (typeof p === 'string' ? p : sourceText.slice(p.srcStart, p.srcEnd))).join('');
  // Join several piece-lists with a separator string.
  const joinPieces = (groups, sep) => groups.flatMap((g, i) => (i === 0 ? g : [sep, ...g]));
  // Coerce a (possibly non-observable) operand into an observable source for
  // combineLatest / switchMap: leave observables as-is, wrap plain values in of().
  const asStream = operand => {
    if (operand.observable) return operand.pieces;
    needed.rxjs.add('of');
    return ['of(', ...operand.pieces, ')'];
  };

  function transformExpression(node) {
    if (ts.isParenthesizedExpression(node)) {
      const inner = transformExpression(node.expression);
      return inner.lifted
        ? { pieces: inner.pieces, observable: true, lifted: true, callable: inner.callable }
        : { pieces: [V(node)], observable: inner.observable, lifted: false };
    }
    // Ternary: when the condition is observable, switchMap so only the taken
    // branch is subscribed (lazy), and shareReplay so it behaves as a
    // RenderObservable (replays its latest value to late subscribers).
    if (ts.isConditionalExpression(node)) {
      const cond = transformExpression(node.condition);
      const whenTrue = transformExpression(node.whenTrue);
      const whenFalse = transformExpression(node.whenFalse);
      if (cond.observable) {
        needed['rxjs/operators'].add('switchMap');
        const param = ts.isIdentifier(node.condition) ? node.condition.text : '_cond';
        // switchMap for laziness; the render() wrapper (added at the binding)
        // provides the shareReplay, so we don't add it here.
        const pieces = [
          ...cond.pieces, '.pipe(switchMap(', param, ' => ', param, ' ? ',
          ...asStream(whenTrue), ' : ', ...asStream(whenFalse), '))',
        ];
        return { pieces, observable: true, lifted: true };
      }
      // Static condition: an ordinary ternary picking between values/streams.
      return { pieces: [V(node)], observable: isObservableExpr(node), lifted: false };
    }

    // Function call. Plain function over observable args → map. An observable
    // *emitting a function* → combineLatest the fn stream with the arg streams
    // and apply the emitted function to the emitted args.
    if (ts.isCallExpression(node)) {
      const callee = transformExpression(node.expression);
      const args = node.arguments.map(transformExpression);
      // Only treat the callee as a function-emitting stream if its emission is
      // actually callable. Calling a non-callable stream (e.g. a derived number)
      // is a boundary violation — leave it verbatim so TS reports it against the
      // stream type, which the teaching diagnostics then explain.
      const calleeIsFnStream = callee.observable && !calleeEmitsNonCallable(node.expression);
      const argsObservable = args.some(a => a.observable);
      if (calleeIsFnStream || (!callee.observable && argsObservable)) {
        needed.rxjs.add('combineLatest');
        needed['rxjs/operators'].add('map');
        const fresh = freshNamer();
        const argParam = (argNode, i) => fresh(ts.isIdentifier(argNode) ? argNode.text : `_a${i}`);

        if (calleeIsFnStream) {
          const fnParam = fresh(ts.isIdentifier(node.expression) ? node.expression.text : '_fn');
          const argParams = node.arguments.map(argParam);
          const sources = joinPieces([callee.pieces, ...args.map(asStream)], ', ');
          const params = [fnParam, ...argParams];
          const pieces = [
            'combineLatest([', ...sources, ']).pipe(map(([', params.join(', '), ']) => ',
            fnParam, '(', argParams.join(', '), ')))',
          ];
          // Emits the result of the emitted function. Only reliable when the
          // callee is checker-visible as an observable (not a tracked binding,
          // whose pre-transform type the checker can't see) — else leave unknown.
          const fnType = observableValueType(checker.getTypeAtLocation(node.expression));
          const callable = fnType ? typeIsCallable(returnTypeOf(fnType)) : undefined;
          return { pieces, observable: true, lifted: true, callable };
        }

        const argParams = node.arguments.map(argParam);
        const sources = joinPieces(args.map(asStream), ', ');
        const pieces = [
          'combineLatest([', ...sources, ']).pipe(map(([', argParams.join(', '), ']) => ',
          ...callee.pieces, '(', argParams.join(', '), ')))',
        ];
        // Plain function over observable args: emits the function's return value.
        // The callee is a real (non-observable) function, so its type is reliable.
        const callable = typeIsCallable(returnTypeOf(checker.getTypeAtLocation(node.expression)));
        return { pieces, observable: true, lifted: true, callable };
      }
      return { pieces: [V(node)], observable: isObservableExpr(node), lifted: false };
    }

    // Prefix unary on a stream → map over it (single source, no combineLatest).
    if (ts.isPrefixUnaryExpression(node) && node.operator in LIFTABLE_UNARY) {
      const operand = transformExpression(node.operand);
      if (operand.observable) {
        needed['rxjs/operators'].add('map');
        const param = ts.isIdentifier(node.operand) ? node.operand.text : '_v';
        const op = LIFTABLE_UNARY[node.operator];
        const pieces = [...operand.pieces, '.pipe(map(', param, ' => ', op, param, '))'];
        return { pieces, observable: true, lifted: true, callable: false };
      }
      return { pieces: [V(node)], observable: false, lifted: false };
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
        const sources = joinPieces([left, right].map(asStream), ', ');
        const op = LIFTABLE[node.operatorToken.kind];
        const pieces = [
          'combineLatest([', ...sources, ']).pipe(map(([', params.join(', '), ']) => ',
          params[0], ' ', op, ' ', params[1], '))',
        ];
        // All these operators emit a primitive — never callable.
        return { pieces, observable: true, lifted: true, callable: false };
      }
      return { pieces: [V(node)], observable: false, lifted: false };
    }
    return { pieces: [V(node)], observable: isObservableExpr(node), lifted: false };
  }

  // Lift variable initializers anywhere — including inside function bodies, since
  // a component is a function. Walk top-down so declarations are seen in source
  // order (so a binding is known observable before later statements use it).
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const r = transformExpression(node.initializer);
      if (r.observable && ts.isIdentifier(node.name)) {
        observableBindings.add(node.name.text);
        if (r.callable === false) nonCallableBindings.add(node.name.text);
      }
      if (r.lifted) {
        // Every imperative result is a RenderObservable: wrap the binding once.
        usedRender = true;
        edits.push({
          start: node.initializer.getStart(sf),
          end: node.initializer.getEnd(),
          pieces: ['render(', ...r.pieces, ')'],
        });
        return; // don't descend into an already-rewritten initializer
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

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
  if (usedRender) importLines.push(`import { render } from "${relativeRuntimeSpecifier(baseDir)}";`);
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
    // Emit the rewritten initializer piece-by-piece: verbatim source slices get
    // 1:1 identity segments (full language features); synthetic scaffolding is
    // appended as generated-only text with no mapping.
    for (const piece of edit.pieces) {
      if (typeof piece === 'string') {
        code += piece;
      } else {
        segments.push({ identity: true, srcStart: piece.srcStart, length: piece.srcEnd - piece.srcStart, genStart: code.length });
        code += sourceText.slice(piece.srcStart, piece.srcEnd);
      }
    }
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
//
// Every mapped span is now an identity (1:1) segment — including the verbatim
// source tokens that survive inside a rewritten expression — so all carry full
// language features. Synthesized scaffolding is generated-only (no segment), so
// it never maps back onto source characters: nothing to smear. The `coarse`
// profile (whole-span ↔ whole-span, position-sensitive features off) remains as
// a defensive fallback should a non-identity segment ever be emitted.
function segmentsToVolarMappings(segments) {
  const full = { completion: true, format: false, navigation: true, semantic: true, structure: true, verification: true };
  const coarse = { completion: false, format: false, navigation: false, semantic: false, structure: false, verification: true };
  const mappings = [];
  for (const seg of segments) {
    if (seg.identity) {
      mappings.push({ sourceOffsets: [seg.srcStart], generatedOffsets: [seg.genStart], lengths: [seg.length], data: full });
    } else {
      mappings.push({
        sourceOffsets: [seg.srcStart], generatedOffsets: [seg.genStart],
        lengths: [seg.srcLen], generatedLengths: [seg.genLen], data: coarse,
      });
    }
  }
  return mappings;
}

module.exports = { transformWithMappings, mapSourceToGenerated, segmentsToVolarMappings, getCompilerOptions };
