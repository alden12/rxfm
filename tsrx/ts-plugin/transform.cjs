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
const fs = require('node:fs');

// The runtime module the generated code imports `render` from. We emit a relative
// specifier from each .tsrx file's directory so it resolves in both the headless
// harness and the editor.
//
// The runtime is located by walking up from the .tsrx file's OWN directory, not
// relative to this module — the plugin is bundled into the VS Code extension's
// node_modules, far from the source tree, so anchoring on `__dirname` emitted an
// unresolvable `../../…/node_modules/runtime` specifier and collapsed every lifted
// binding to `any` in the installed extension. `__dirname/../runtime.ts` is only a
// last-resort fallback (covers the in-repo plugin running from source).
const FALLBACK_RUNTIME_PATH = path.join(__dirname, '..', 'runtime.ts');

function findRuntimeFile(baseDir) {
  let dir = baseDir;
  for (let i = 0; i < 16; i++) {
    const candidate = path.join(dir, 'runtime.ts');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function relativeRuntimeSpecifier(baseDir) {
  const runtime = findRuntimeFile(baseDir) || FALLBACK_RUNTIME_PATH;
  let rel = path.relative(baseDir, runtime).replace(/\.ts$/, '').split(path.sep).join('/');
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
//
// Cross-.tsrx imports: a `.tsrx` file importing another `.tsrx` must see the
// imported reactive values with REAL types — lifting is checker-driven, so an
// `any` import would silently stop derivations lifting. So we resolve `./foo` to a
// sibling `foo.tsrx` (when normal resolution finds nothing) and serve it as TS,
// transformed on the fly. (No cycle handling yet; .tsrx import graphs are shallow.)
function createProgramFromText(ts, fileName, text, options) {
  const host = ts.createCompilerHost(options, true);
  const isTsrx = f => typeof f === 'string' && f.endsWith('.tsrx');
  const tsrxCache = new Map();
  const tsrxCode = f => {
    const src = fs.readFileSync(f, 'utf8');
    const hit = tsrxCache.get(f);
    if (hit && hit.src === src) return hit.code;
    const { code } = transformWithMappings(ts, src, path.dirname(f));
    tsrxCache.set(f, { src, code });
    return code;
  };

  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, ...rest) => {
    if (name === fileName) return ts.createSourceFile(name, text, languageVersion, true);
    if (isTsrx(name)) return ts.createSourceFile(name, tsrxCode(name), languageVersion, true, ts.ScriptKind.TS);
    return getSourceFile(name, languageVersion, ...rest);
  };
  host.fileExists = f => (f === fileName ? true : ts.sys.fileExists(f));
  const readFile = host.readFile.bind(host);
  host.readFile = f => (f === fileName ? text : isTsrx(f) ? tsrxCode(f) : readFile(f));

  const resolve = (name, containingFile) => {
    const standard = ts.resolveModuleName(name, containingFile, options, host).resolvedModule;
    if (standard) return standard;
    if (name.startsWith('.')) {
      const candidate = path.resolve(path.dirname(containingFile), `${name}.tsrx`);
      if (ts.sys.fileExists(candidate)) return { resolvedFileName: candidate, extension: ts.Extension.Ts };
    }
    return undefined;
  };
  if (ts.resolveModuleNameLiterals) {
    host.resolveModuleNameLiterals = (literals, containingFile) =>
      literals.map(lit => ({ resolvedModule: resolve(lit.text, containingFile) }));
  } else {
    host.resolveModuleNames = (names, containingFile) => names.map(n => resolve(n, containingFile));
  }
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
  // Short-circuiting operators: lifted lazily via switchMap (like the ternary) so
  // the right-hand stream is only subscribed when the left actually selects it.
  const LOGICAL = {
    [ts.SyntaxKind.AmpersandAmpersandToken]: '&&',
    [ts.SyntaxKind.BarBarToken]: '||',
    [ts.SyntaxKind.QuestionQuestionToken]: '??',
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
  // Bindings whose lifted value can be EMPTY (a `cond ? x : EMPTY` filter idiom):
  // they may never emit, so combining them with combineLatest can stall. Tracked so
  // we can warn when one feeds a combine. Paired source spans collected in `stalls`.
  const maybeEmptyBindings = new Set();
  const stalls = [];
  const needed = { rxjs: new Set(), 'rxjs/operators': new Set(), rxfm: new Set() };
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

  // Does this expression evaluate to an observable that completes WITHOUT emitting
  // (RxJS `EMPTY`, i.e. Observable<never>)? Used to spot the `cond ? x : EMPTY`
  // filter idiom so we can flag the resulting binding as maybe-empty.
  const emitsNever = node => {
    const value = observableValueType(checker.getTypeAtLocation(node));
    return Boolean(value && value.flags & ts.TypeFlags.Never);
  };

  // Record a "stall" warning when an operand fed into a combineLatest is a
  // maybe-empty binding: combineLatest waits for every source's first emission, so a
  // source that can stay EMPTY freezes the whole derived value until (if ever) it
  // emits. The `cond ? x : EMPTY` filter idiom is fine standalone (as a child) but
  // hazardous when combined — this teaches that exactly where it happens.
  const noteStall = node => {
    if (ts.isIdentifier(node) && maybeEmptyBindings.has(node.text)) {
      stalls.push({ start: node.getStart(sf), length: node.getEnd() - node.getStart(sf), name: node.text });
    }
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

  // The RxJS Observable/Subject surface — members that operate on the STREAM
  // itself, not the value it emits. Used only as a fallback for tracked bindings
  // whose pre-transform type the checker can't see; checker-visible observables
  // are asked directly. (A tracked binding emitting an object with a field named
  // like one of these — e.g. `.value` — would be read as a stream op; rare.)
  const STREAM_MEMBERS = new Set([
    'subscribe', 'pipe', 'forEach', 'lift', 'toPromise', 'asObservable', 'source', 'operator',
    'next', 'error', 'complete', 'value', 'getValue', 'closed', 'observed',
    'hasError', 'thrownError', 'unsubscribe', 'observers',
  ]);

  // For `obj.member` where obj is a stream: does `member` target the emitted
  // value (→ lift via map) rather than the stream API (→ leave, it's .pipe/.value
  // etc.)? Ask the checker when obj is checker-visible as an observable; else
  // fall back to the known RxJS surface.
  const memberTargetsValue = (objNode, name) => {
    const t = checker.getTypeAtLocation(objNode);
    if (isObservableType(t)) return !t.getProperty(name);
    return !STREAM_MEMBERS.has(name);
  };

  // Structural test for a DOM element type — RxFM components emit these.
  const isElementValueType = type =>
    Boolean(type && type.getProperty && type.getProperty('nodeType') &&
      (type.getProperty('tagName') || type.getProperty('nodeName')));

  // Does this function expression return a component (an Observable of a DOM
  // element)? Excludes `any` (which a value-mapping callback gets, since its item
  // param is untyped once `.map` fails to resolve on Observable). Reliable because
  // component creators (Div, …) are typed regardless of the item param.
  const returnsComponent = fnNode => {
    const sig = checker.getSignatureFromDeclaration(fnNode);
    if (!sig) return false;
    const ret = checker.getReturnTypeOfSignature(sig);
    if (ret.flags & ts.TypeFlags.Any) return false;
    return isElementValueType(observableValueType(ret));
  };

  // Side-effect-free observability for a member/method/index chain: true when the
  // chain roots in an observable (so the whole thing lifts to stay observable).
  // Lets `items.filter(...).map(...)` be recognised, where the checker can't type
  // the derived receiver directly.
  const isObservableChain = node => {
    if (!node) return false;
    if (isObservableExpr(node)) return true;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      return isObservableChain(node.expression.expression);
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      return isObservableChain(node.expression);
    }
    if (ts.isParenthesizedExpression(node)) return isObservableChain(node.expression);
    return false;
  };

  // Is this `obj.map(cb, key?)` where obj is a stream and cb returns a component?
  // Such a call is the imperative way to render a list — lift it to
  // mapToComponents (keyed reconciliation) rather than a naive array map.
  const isComponentMapCall = node => {
    if (!ts.isCallExpression(node) || node.arguments.length < 1) return false;
    const ex = node.expression;
    if (!ts.isPropertyAccessExpression(ex) || ex.name.text !== 'map') return false;
    const cb = node.arguments[0];
    if (!ts.isArrowFunction(cb) && !ts.isFunctionExpression(cb)) return false;
    return isObservableChain(ex.expression) && returnsComponent(cb);
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
      if (inner.lifted) return { pieces: inner.pieces, observable: true, lifted: true, callable: inner.callable };
      if (inner.rewritten) return { pieces: ['(', ...inner.pieces, ')'], observable: inner.observable, lifted: false, rewritten: true };
      return { pieces: [V(node)], observable: inner.observable, lifted: false };
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
        // `cond ? x : EMPTY` (the filter idiom) can produce no value: flag it so a
        // later combine over this binding can warn about stalling.
        const emptyable = emitsNever(node.whenTrue) || emitsNever(node.whenFalse);
        return { pieces, observable: true, lifted: true, emptyable };
      }
      // Static condition: an ordinary ternary picking between values/streams.
      return { pieces: [V(node)], observable: isObservableExpr(node), lifted: false };
    }

    // Template literal with an observable interpolation → combineLatest the
    // observable parts and rebuild the string in map. The literal text tokens
    // (head / middle / tail, including their backticks and ${}) are emitted
    // verbatim, so escaping is preserved exactly; non-observable interpolations
    // stay inline.
    if (ts.isTemplateExpression(node)) {
      const spans = node.templateSpans.map(s => ({ expr: transformExpression(s.expression), node: s.expression, literal: s.literal }));
      if (spans.some(s => s.expr.observable)) {
        needed.rxjs.add('combineLatest');
        needed['rxjs/operators'].add('map');
        const fresh = freshNamer();
        const sources = [];
        const params = [];
        const subs = spans.map(s => {
          if (!s.expr.observable) return { inline: s.expr.pieces };
          const p = fresh(ts.isIdentifier(s.node) ? s.node.text : '_e');
          sources.push(s.expr.pieces);
          params.push(p);
          return { param: p };
        });
        const body = [V(node.head)];
        spans.forEach((s, i) => {
          const sub = subs[i];
          body.push(...(sub.param ? [sub.param] : sub.inline));
          body.push(V(s.literal));
        });
        const pieces = [
          'combineLatest([', ...joinPieces(sources, ', '), ']).pipe(map(([', params.join(', '), ']) => ',
          ...body, '))',
        ];
        return { pieces, observable: true, lifted: true, callable: false };
      }
      return { pieces: [V(node)], observable: false, lifted: false };
    }

    // Function call. Plain function over observable args → map. An observable
    // *emitting a function* → combineLatest the fn stream with the arg streams
    // and apply the emitted function to the emitted args.
    if (ts.isCallExpression(node)) {
      // A component call (Div(...), Span(...), …) is a structure, not a value to
      // lift: its observable arguments are reactive children RxFM renders, and any
      // nested component-map is handled by `visit`. Leave it verbatim.
      if (isElementValueType(observableValueType(checker.getTypeAtLocation(node)))) {
        return { pieces: [V(node)], observable: true, lifted: false };
      }
      // Method call on a stream: obj.method(args) where obj is observable and
      // method targets the emitted value → call it ON the emitted value (so
      // `this` is preserved), rather than extracting the method off the stream.
      const ex = node.expression;
      if (ts.isPropertyAccessExpression(ex)) {
        const obj = transformExpression(ex.expression);
        if (obj.observable && memberTargetsValue(ex.expression, ex.name.text)) {
          needed.rxjs.add('combineLatest');
          needed['rxjs/operators'].add('map');
          const fresh = freshNamer();
          const objParam = fresh(ts.isIdentifier(ex.expression) ? ex.expression.text : '_o');
          // Function-expression args are callbacks (arr.map/filter's fn): keep
          // them inline so they stay contextually typed; only stream args become
          // combineLatest sources.
          const sources = [obj.pieces];
          const params = [objParam];
          const callArgs = node.arguments.map((argNode, i) => {
            if (ts.isArrowFunction(argNode) || ts.isFunctionExpression(argNode)) return [V(argNode)];
            const p = fresh(ts.isIdentifier(argNode) ? argNode.text : `_a${i}`);
            sources.push(asStream(transformExpression(argNode)));
            params.push(p);
            return [p];
          });
          const pieces = [
            'combineLatest([', ...joinPieces(sources, ', '), ']).pipe(map(([', params.join(', '), ']) => ',
            objParam, '.', V(ex.name), '(', ...joinPieces(callArgs, ', '), ')))',
          ];
          return { pieces, observable: true, lifted: true };
        }
      }

      const callee = transformExpression(node.expression);
      const args = node.arguments.map(transformExpression);
      // Only treat the callee as a function-emitting stream if its emission is
      // actually callable. Calling a non-callable stream (e.g. a derived number)
      // is a boundary violation — leave it verbatim so TS reports it against the
      // stream type, which the teaching diagnostics then explain.
      const calleeIsFnStream = callee.observable && !calleeEmitsNonCallable(node.expression);
      const argsObservable = args.some(a => a.observable);
      // A parameter typed `Observable<…>` wants to RECEIVE the stream — the callee
      // is operator-style (`destructure`, `mapToComponents`, a custom
      // `accumulate(stream, …)`, …). Its observable argument must pass through
      // verbatim, not be mapped over per emission. Ask the checker which arguments
      // land on such parameters; the rest (value args over observables) still lift.
      const sig = checker.getResolvedSignature(node);
      const paramExpectsObservable = i => {
        const params = sig ? sig.getParameters() : [];
        if (!params.length) return false;
        const pSym = params[Math.min(i, params.length - 1)];
        return Boolean(pSym) && isObservableType(checker.getTypeOfSymbolAtLocation(pSym, node));
      };
      const liftableArg = args.map((a, i) => a.observable && !paramExpectsObservable(i));
      if (calleeIsFnStream || (!callee.observable && argsObservable)) {
        // Every observable argument is one the callee wants as a stream (no value
        // arg actually needs lifting): an operator-style call. Leave the call itself
        // in place — it keeps its real semantics and is NOT render-wrapped (the callee
        // may return a non-observable, e.g. destructure's object). But if an argument
        // itself lifted (e.g. interval(periodFor(difficulty))), re-emit the call with
        // that argument's transformed pieces so the inner lift survives. Pieces
        // compose, so nested operator-style calls work too.
        if (!calleeIsFnStream && !liftableArg.some(Boolean)) {
          if (!args.some(a => a.lifted || a.rewritten)) {
            return { pieces: [V(node)], observable: isObservableExpr(node), lifted: false };
          }
          const pieces = [...callee.pieces, '(', ...joinPieces(args.map(a => a.pieces), ', '), ')'];
          return { pieces, observable: isObservableExpr(node), lifted: false, rewritten: true };
        }
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

        // Plain function call: combineLatest only the value args that need lifting;
        // inline everything else (plain values, and any stream the callee takes as a
        // parameter) verbatim in the call so its real arguments are preserved.
        const params = [];
        const sources = [];
        const callArgs = node.arguments.map((argNode, i) => {
          if (!liftableArg[i]) return args[i].pieces;
          const p = argParam(argNode, i);
          params.push(p);
          sources.push(asStream(args[i]));
          return [p];
        });
        const pieces = [
          'combineLatest([', ...joinPieces(sources, ', '), ']).pipe(map(([', params.join(', '), ']) => ',
          ...callee.pieces, '(', ...joinPieces(callArgs, ', '), ')))',
        ];
        // Plain function over observable args: emits the function's return value.
        // The callee is a real (non-observable) function, so its type is reliable.
        const callable = typeIsCallable(returnTypeOf(checker.getTypeAtLocation(node.expression)));
        return { pieces, observable: true, lifted: true, callable };
      }
      return { pieces: [V(node)], observable: isObservableExpr(node), lifted: false };
    }

    // Property access on a stream → map out the field (the RxFM "extract a field
    // from an object observable" pattern), unless the member is a stream-API one.
    if (ts.isPropertyAccessExpression(node)) {
      // Collapse a chain of property accesses rooted in a single stream into ONE map
      // (`state.trail.coordinates` → `state.pipe(map(state => state.trail.coordinates))`)
      // rather than a map per hop. Walk down through property accesses to the root;
      // fuse only when it's a pure property chain (≥2 hops) rooted in an observable
      // whose first hop targets the emitted value (not a stream member like `.value`).
      let root = node.expression;
      let firstName = node.name;
      while (ts.isPropertyAccessExpression(root)) {
        firstName = root.name;
        root = root.expression;
      }
      if (root !== node.expression && isObservableExpr(root) && memberTargetsValue(root, firstName.text)) {
        needed['rxjs/operators'].add('map');
        const rootR = transformExpression(root);
        const p = ts.isIdentifier(root) ? root.text : '_o';
        // The access path (`.trail.coordinates`) is emitted as a mapped source slice
        // so hover / go-to-def on each property still resolves.
        const path = { srcStart: root.getEnd(), srcEnd: node.getEnd() };
        const pieces = [...rootR.pieces, '.pipe(map(', p, ' => ', p, path, '))'];
        return { pieces, observable: true, lifted: true };
      }
      const obj = transformExpression(node.expression);
      if (obj.observable && memberTargetsValue(node.expression, node.name.text)) {
        needed['rxjs/operators'].add('map');
        const p = ts.isIdentifier(node.expression) ? node.expression.text : '_o';
        const pieces = [...obj.pieces, '.pipe(map(', p, ' => ', p, '.', V(node.name), '))'];
        return { pieces, observable: true, lifted: true };
      }
      return { pieces: [V(node)], observable: isObservableExpr(node), lifted: false };
    }

    // Element access where the object and/or the index is a stream → map out the
    // indexed value. Three cases: object observable (+ optional observable index,
    // via combineLatest), or a static object with an observable index.
    if (ts.isElementAccessExpression(node)) {
      const obj = transformExpression(node.expression);
      const index = transformExpression(node.argumentExpression);
      if (obj.observable) {
        needed['rxjs/operators'].add('map');
        const p = ts.isIdentifier(node.expression) ? node.expression.text : '_o';
        if (index.observable) {
          needed.rxjs.add('combineLatest');
          const pieces = [
            'combineLatest([', ...joinPieces([obj.pieces, asStream(index)], ', '),
            ']).pipe(map(([', p, ', _i]) => ', p, '[_i]))',
          ];
          return { pieces, observable: true, lifted: true };
        }
        const pieces = [...obj.pieces, '.pipe(map(', p, ' => ', p, '[', ...index.pieces, ']))'];
        return { pieces, observable: true, lifted: true };
      }
      // Static object, observable index (e.g. `CELL_COLOR_MAP[cell]`): drive off the
      // index — `cell.pipe(map(cell => CELL_COLOR_MAP[cell]))`. The object expression
      // is re-referenced inside the map, which is free for the common case (a constant
      // lookup table named by identifier).
      if (index.observable) {
        needed['rxjs/operators'].add('map');
        const i = ts.isIdentifier(node.argumentExpression) ? node.argumentExpression.text : '_i';
        const pieces = [...index.pieces, '.pipe(map(', i, ' => ', ...obj.pieces, '[', i, ']))'];
        return { pieces, observable: true, lifted: true };
      }
      return { pieces: [V(node)], observable: isObservableExpr(node), lifted: false };
    }

    // Short-circuiting logical operator with an observable left → switchMap, so
    // the right side is only subscribed when the left selects it.
    if (ts.isBinaryExpression(node) && node.operatorToken.kind in LOGICAL) {
      const left = transformExpression(node.left);
      const right = transformExpression(node.right);
      if (left.observable) {
        needed['rxjs/operators'].add('switchMap');
        needed.rxjs.add('of');
        const kind = LOGICAL[node.operatorToken.kind];
        const p = ts.isIdentifier(node.left) ? node.left.text : '_l';
        const keep = ['of(', p, ')']; // re-emit the left value
        const other = asStream(right);
        // && selects the right when left is truthy; || when falsy; ?? when nullish.
        const cond = kind === '??' ? [p, ' != null'] : [p];
        const [whenTrue, whenFalse] = kind === '&&' ? [other, keep] : [keep, other];
        const pieces = [
          ...left.pieces, '.pipe(switchMap(', p, ' => ', ...cond, ' ? ', ...whenTrue, ' : ', ...whenFalse, '))',
        ];
        // Branches may emit functions, so callability is left unknown.
        return { pieces, observable: true, lifted: true };
      }
      // Left isn't a stream: a one-shot JS decision, not a lift. Leave verbatim.
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
        noteStall(node.left);
        noteStall(node.right);
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

  // Rewrite `obj.map(cb, key?)` → `obj.pipe(mapToComponents(cb, key?))`, keeping
  // cb/key in place and lifting cb's body with its item/index params treated as
  // observables. mapToComponents gives keyed reconciliation; the optional second
  // arg (id prop name or id function) maps onto its idPropOrFunction, defaulting
  // to index when omitted. Done with edge edits so it composes with the inner
  // body edits without overlap.
  const handleComponentMap = node => {
    const ex = node.expression;     // obj.map
    const obj = ex.expression;      // obj
    const cb = node.arguments[0];   // arrow / function expression
    needed.rxfm.add('mapToComponents');
    // Lift the receiver if it's itself an imperative expression (e.g. a filter).
    const objR = transformExpression(obj);
    if (objR.lifted) edits.push({ start: obj.getStart(sf), end: obj.getEnd(), pieces: objR.pieces });
    // `.map(` → `.pipe(mapToComponents(`, final `)` → `))`. The `map` token is
    // *remapped* (not swallowed) to the generated `mapToComponents` identifier so
    // hovering `.map` shows mapToComponents' signature/docs rather than nothing.
    edits.push({ start: obj.getEnd(), end: ex.name.getStart(), pieces: ['.pipe('] });
    edits.push({ start: ex.name.getStart(), end: ex.name.getEnd(), remap: 'mapToComponents' });
    edits.push({ start: node.getEnd() - 1, end: node.getEnd(), pieces: ['))'] });
    // Lift the callback body with its params (item, index) treated as observables,
    // scoped so the marking doesn't leak past this callback.
    const params = cb.parameters.map(p => p.name.getText(sf));
    const added = params.filter(p => !observableBindings.has(p));
    added.forEach(p => observableBindings.add(p));
    visit(cb.body);
    added.forEach(p => observableBindings.delete(p));
    // The key arg (if any) operates on the plain item value — left verbatim.
  };

  // D2: an event handler is a closure that runs *later*, so a stream referenced
  // inside it is the stream, not its current value. When a handler captures
  // observable bindings, lift it to a stream of handlers — the handler text is left
  // verbatim and the map params re-bind the same names to current values:
  //   () => f(index)            →  index.pipe(map(index => () => f(index)))
  //   () => f(index, current)   →  combineLatest([index, current]).pipe(
  //                                  map(([index, current]) => () => f(index, current)))
  // rxfm's event operators already accept an Observable<handler> (EventHandler<T,E>).
  const within = (node, ancestor) => node.getStart(sf) >= ancestor.getStart(sf) && node.getEnd() <= ancestor.getEnd();
  const collectHandlerCaptures = fnNode => {
    // A captured stream is lifted only if the handler reads it as a *value*. If it's
    // touched via its stream API (`subject.next(…)`, `.value`, `.pipe`), the handler
    // legitimately operates on the stream itself — lifting would replace it with a
    // value and break the call — so such names are excluded entirely.
    const valueUsed = new Map();
    const streamUsed = new Set();
    const walk = n => {
      if (ts.isIdentifier(n)) {
        const p = n.parent;
        if (ts.isPropertyAccessExpression(p) && p.name === n) return;     // property name, not a ref
        if (ts.isQualifiedName(p) && p.right === n) return;
        if ((ts.isPropertyAssignment(p) || ts.isBindingElement(p) || ts.isParameter(p)) && p.name === n) return;
        if (!isObservableExpr(n)) return;
        const sym = checker.getSymbolAtLocation(n);
        const decl = sym && sym.declarations && sym.declarations[0];
        if (decl && within(decl, fnNode)) return;                          // local to handler, not a capture
        if (ts.isPropertyAccessExpression(p) && p.expression === n && !memberTargetsValue(n, p.name.text)) {
          streamUsed.add(n.text);                                          // e.g. difficulty.next(...)
        } else if (!valueUsed.has(n.text)) {
          valueUsed.set(n.text, n);
        }
        return;
      }
      ts.forEachChild(n, walk);
    };
    walk(fnNode.body);
    for (const name of streamUsed) valueUsed.delete(name);
    return valueUsed;
  };
  const liftHandlerClosure = fnNode => {
    const names = [...collectHandlerCaptures(fnNode).keys()];
    if (!names.length) return null;
    needed['rxjs/operators'].add('map');
    if (names.length === 1) return [names[0], '.pipe(map(', names[0], ' => ', V(fnNode), '))'];
    needed.rxjs.add('combineLatest');
    return ['combineLatest([', names.join(', '), ']).pipe(map(([', names.join(', '), ']) => ', V(fnNode), '))'];
  };
  // Does parameter `argIndex` of this call accept an Observable (e.g. an
  // EventHandler slot, which is `handler | Observable<handler>`)?
  const paramAcceptsObservable = (callNode, argIndex) => {
    const sig = checker.getResolvedSignature(callNode);
    if (!sig) return false;
    const params = sig.getParameters();
    if (!params.length) return false;
    const pSym = params[Math.min(argIndex, params.length - 1)];
    return Boolean(pSym) && isObservableType(checker.getTypeOfSymbolAtLocation(pSym, callNode));
  };

  // Lift variable initializers anywhere — including inside function bodies, since
  // a component is a function. Walk top-down so declarations are seen in source
  // order (so a binding is known observable before later statements use it).
  const visit = node => {
    // Component-list map in any expression position (e.g. a child argument).
    if (isComponentMapCall(node)) {
      handleComponentMap(node);
      return;
    }
    if (ts.isVariableDeclaration(node) && node.initializer) {
      // `const list = items.map(item => <component>)` — a component array binding.
      if (isComponentMapCall(node.initializer)) {
        if (ts.isIdentifier(node.name)) observableBindings.add(node.name.text);
        handleComponentMap(node.initializer);
        return;
      }
      // Destructuring an observable into its fields: `const { board, gameStage } = game`
      // → `const board = render(game.pipe(map(game => game.board))), gameStage = …`.
      // Each field becomes its own lifted member-access binding (the same shape the
      // member-access lift produces), so it reads like ordinary destructuring.
      // Limited to an identifier source — a non-identifier would be re-subscribed
      // once per field.
      if (ts.isObjectBindingPattern(node.name) && ts.isIdentifier(node.initializer)
        && transformExpression(node.initializer).observable) {
        const src = node.initializer;
        const param = src.text;
        needed['rxjs/operators'].add('map');
        usedRender = true;
        const groups = node.name.elements.map(el => {
          if (el.dotDotDotToken || !ts.isIdentifier(el.name)) return null;
          const prop = (el.propertyName || el.name).getText(sf);
          observableBindings.add(el.name.text);
          return [V(el.name), ' = render(', V(src), `.pipe(map(${param} => ${param}.${prop})))`];
        });
        if (groups.every(Boolean)) {
          edits.push({
            start: node.name.getStart(sf),
            end: node.initializer.getEnd(),
            pieces: joinPieces(groups, ', '),
          });
          return;
        }
      }
      const r = transformExpression(node.initializer);
      if (r.observable && ts.isIdentifier(node.name)) {
        observableBindings.add(node.name.text);
        if (r.callable === false) nonCallableBindings.add(node.name.text);
        if (r.emptyable) maybeEmptyBindings.add(node.name.text);
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
      if (r.rewritten) {
        // An operator-style call left in place but with a lifted argument rewritten:
        // apply the pieces as-is (no render wrap — the call's own result stands).
        edits.push({
          start: node.initializer.getStart(sf),
          end: node.initializer.getEnd(),
          pieces: r.pieces,
        });
        return;
      }
    }
    // Tagged template (RxFM's children syntax, e.g. Div`hi ${user.name}`): each
    // ${…} interpolation is a child, and RxFM renders observables as reactive
    // children — so lift each imperative interpolation *individually* (rather
    // than combining into one string like the untagged template literal case),
    // leaving the template structure intact for RxFM to handle.
    if (ts.isTaggedTemplateExpression(node) && ts.isTemplateExpression(node.template)) {
      visit(node.tag);
      for (const span of node.template.templateSpans) {
        const r = transformExpression(span.expression);
        if (r.lifted) {
          usedRender = true;
          edits.push({
            start: span.expression.getStart(sf),
            end: span.expression.getEnd(),
            pieces: ['render(', ...r.pieces, ')'],
          });
        } else if (r.rewritten) {
          edits.push({
            start: span.expression.getStart(sf),
            end: span.expression.getEnd(),
            pieces: r.pieces,
          });
        } else {
          visit(span.expression); // recurse — may hold nested tagged templates
        }
      }
      return; // interpolations handled; don't re-descend
    }
    // Call arguments (component children, chainable `.class(…)` / `.attr(…)` args, …):
    // lift an observable argument in place. Like object-literal values, only `lifted`
    // arguments are touched — an observable here would otherwise be a type error — so
    // plain arguments and the callee are left to descend normally. (Initializers and
    // component-`.map` calls are handled above and never reach here, so this doesn't
    // double-handle or fight C6's operator-style arg lifting.)
    if (ts.isCallExpression(node)) {
      visit(node.expression); // the callee chain (may hold object literals, nested calls, templates)
      node.arguments.forEach((arg, i) => {
        if (ts.isSpreadElement(arg)) { visit(arg); return; }
        // A component-`.map` child (e.g. `Div(items.map(cb))`) is a keyed list, not a
        // value to render — hand it to the list handler, not the expression lifter.
        if (isComponentMapCall(arg)) { handleComponentMap(arg); return; }
        // An event handler capturing streams → a stream of handlers (D2).
        if ((ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) && paramAcceptsObservable(node, i)) {
          const handler = liftHandlerClosure(arg);
          if (handler) { edits.push({ start: arg.getStart(sf), end: arg.getEnd(), pieces: handler }); return; }
        }
        const r = transformExpression(arg);
        if (r.lifted) {
          usedRender = true;
          edits.push({ start: arg.getStart(sf), end: arg.getEnd(), pieces: ['render(', ...r.pieces, ')'] });
        } else if (r.rewritten) {
          edits.push({ start: arg.getStart(sf), end: arg.getEnd(), pieces: r.pieces });
        } else {
          visit(arg);
        }
      });
      return;
    }
    // Object-literal property values (e.g. `.style({ backgroundColor: cell.color })`):
    // lift an observable value in place rather than forcing it to be named first.
    // Only `lifted` values are touched — those are observable expressions that would
    // otherwise be a type error here anyway — so a constant value is left untouched.
    if (ts.isObjectLiteralExpression(node)) {
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop)) {
          const r = transformExpression(prop.initializer);
          if (r.lifted) {
            usedRender = true;
            edits.push({
              start: prop.initializer.getStart(sf),
              end: prop.initializer.getEnd(),
              pieces: ['render(', ...r.pieces, ')'],
            });
          } else if (r.rewritten) {
            edits.push({ start: prop.initializer.getStart(sf), end: prop.initializer.getEnd(), pieces: r.pieces });
          } else {
            visit(prop.initializer);
          }
        } else {
          visit(prop);
        }
      }
      return;
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
  const rxfmNew = newNames('rxfm', needed.rxfm);
  if (rxfmNew.length) importLines.push(`import { ${rxfmNew.join(', ')} } from "rxfm";`);
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
  return { code, segments, sourceDiagnostics, stalls };
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
    } else {
      mappings.push({
        sourceOffsets: [seg.srcStart], generatedOffsets: [seg.genStart],
        lengths: [seg.srcLen], generatedLengths: [seg.genLen], data: seg.navigable ? navigable : coarse,
      });
    }
  }
  return mappings;
}

module.exports = { transformWithMappings, mapSourceToGenerated, segmentsToVolarMappings, getCompilerOptions };
