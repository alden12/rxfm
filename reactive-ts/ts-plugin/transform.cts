// Reactive TS transform — canonical (CommonJS, injected `ts`).
//
// Takes the TypeScript module + raw .rts source text, returns generated TS plus
// position MAPPINGS. Used by the headless harness AND the editor tsserver plugin,
// so the runtime, the CLI, and live editor types all share one implementation.
//
// Inference is checker-driven: we build a throwaway Program from the source text
// to learn which identifiers are observables. The `+`-on-Observable error doesn't
// poison operand types, so leaf detection is reliable; derived bindings are
// tracked ourselves (the propagation table).
'use strict';
const path = require('node:path');

// TypeScript is INJECTED at runtime (tsserver hands the plugin its own copy), so we
// only borrow its types at compile time — `import type` is fully erased at emit.
import type * as TS from 'typescript';
// The transform's data model lives in transform-types (a types-only module).
import type {
  Ts, SrcSlice, Piece, Operand, AliasInfo, Edit,
  Stall, HigherOrder, RootMapping, DeclMapping,
} from './transform-types.cjs';
import { operatorTables } from './transform-operators.cjs';
import { getCompilerOptions, createProgramFromText } from './transform-program.cjs';
import { assembleOutput, mapSourceToGenerated, segmentsToVolarMappings } from './transform-emit.cjs';
import { createChecker } from './transform-checker.cjs';

export function transformWithMappings(ts: Ts, sourceText: string, baseDir: string) {
  const { LIFTABLE, LIFTABLE_UNARY, LOGICAL } = operatorTables(ts);

  const fileName = path.join(baseDir, '__rts_virtual__.ts');
  const options = getCompilerOptions(ts);
  const program = createProgramFromText(ts, fileName, sourceText, options, transformWithMappings);
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(fileName)!;

  // ---------------------------------------------------------------------------
  // The transform's mutable state. Two roles:
  //   (1) TRAVERSAL-SCOPED TRACKING — what `visit`/`transformExpression` have
  //       learned about the source so far (which names are observable, what each
  //       destructured field stands for). Some is pushed/popped per `.map`
  //       callback so a marking doesn't leak past its scope.
  //   (2) OUTPUT-PLAN ACCUMULATORS — the plan handed to `assembleOutput`: the
  //       edits to splice, the imports needed, the position-mapping bookkeeping,
  //       and the warnings to surface.
  // ---------------------------------------------------------------------------

  // (1) Traversal-scoped tracking.
  const observableBindings = new Set<string>();
  // D4: destructured fields of a stream item, scoped to one component-`.map`
  // callback. Maps an alias name (the field binding) → { param, prop }, where
  // `param` is the synthetic stream identifier the binding pattern was renamed to.
  // A reference to the alias lifts to `param.pipe(map(param => param.prop))`, and
  // several aliases of the same item share `param` so they collapse like `cell.x`.
  const aliasInfo = new Map<string, AliasInfo>();
  // Lifted bindings whose emitted value is definitely not callable (e.g. the
  // result of an arithmetic lift). The checker can't tell us this — it analyses
  // the original (pre-transform) source, where these bindings have an erroring/
  // unrelated type — so we record it as we lift. Used to refuse the
  // "observable-emitting-a-function" call lift for them, letting the imperative
  // boundary surface instead (RenderObservable<number> has no call signatures).
  const nonCallableBindings = new Set<string>();
  // Bindings whose lifted value can be EMPTY (a `cond ? x : EMPTY` filter idiom):
  // they may never emit, so combining them with combineLatest can stall. Tracked so
  // we can warn when one feeds a combine. Paired source spans collected in `stalls`.
  const maybeEmptyBindings = new Set<string>();
  // `cbSeq` keys destructured fields to their callback (so a field name reused
  // across callbacks resolves to its own callback's use); `collapseSeq` keys each
  // single-root collapse to its own outer stream reference. Both feed the hover
  // mappings below.
  let cbSeq = 0;
  let collapseSeq = 0;

  // (2) Output-plan accumulators.
  const edits: Edit[] = [];
  const needed = { rxjs: new Set<string>(), 'rxjs/operators': new Set<string>(), rxfm: new Set<string>() };
  let usedRender = false;
  // Declaration-site hover for destructured fields: the binding pattern `{ color }`
  // is erased to the synthetic param, so its field tokens map to nothing. We record
  // each field's declaration span and, after assembly, map it onto the generated
  // `item.prop` token its first use produced — so hover / go-to-def work on the
  // binding too, not just the uses.
  const declMappings: DeclMapping[] = [];
  // D5 hover: when a single-root expression collapses to `x.pipe(map(x => …))`, the
  // root's source occurrences are emitted as the map param but mapped onto the OUTER
  // stream reference, so hovering the variable shows its `Observable<…>` type (like
  // the member-access lift) rather than the in-map value.
  const rootMappings: RootMapping[] = [];
  const stalls: Stall[] = [];
  // Spans where a lifted call is higher-order (the callee returns an observable, so
  // mapping over a lifted arg nests it: Observable<Observable<…>>). Surfaced as a
  // warning, since it type-checks and would otherwise be a silent footgun.
  const higherOrder: HigherOrder[] = [];

  // The checker predicates (see transform-checker), bound to this run's checker and
  // the slice of state above they read/write. Destructured so the planning code
  // below reads them as plain predicates.
  const {
    isObservableType, isObservableExpr, paramAcceptsObservable, observableValueType,
    emitsNever, noteStall, calleeEmitsNonCallable, typeIsCallable, returnTypeOf,
    memberTargetsValue, isElementValueType, isComponentMapCall,
  } = createChecker(ts, checker, sf, { observableBindings, aliasInfo, maybeEmptyBindings, nonCallableBindings, stalls });

  // The set of root identifier names of every observable VALUE referenced in `node`,
  // or null if the expression can't lift as one `x.pipe(map(x => <verbatim>))`. When
  // this is a single name, the whole expression lifts that way — it runs as plain code
  // with `x` bound to the emitted value, so TS's control-flow narrowing is preserved
  // (D3) and a single-stream operator chain becomes one map (D5).
  //
  // An observable counts only when it's read as a VALUE (`x`, `x.field`, `x[i]`):
  //   - a stream-API use (`x.value`, `x.next(…)`, `x.pipe(…)`) means binding `x` to the
  //     emitted value would break the call, so the expression can't collapse → null;
  //   - an observable that isn't a bare identifier (e.g. a call returning a stream)
  //     has no named root → null;
  //   - property names / binding targets aren't value references and are skipped.
  const observableRoots = (node: TS.Node): Set<string> | null => {
    const names = new Set<string>();
    let ok = true;
    const walk = (n: TS.Node) => {
      if (!ok) return;
      if (ts.isIdentifier(n)) {
        const p = n.parent;
        if (ts.isPropertyAccessExpression(p) && p.name === n) return;            // a property name
        if (ts.isQualifiedName(p) && p.right === n) return;
        if ((ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)
          || ts.isBindingElement(p) || ts.isParameter(p)) && p.name === n) return;
        if (!isObservableExpr(n)) return;
        // Read via a stream-API member (`x.value`, `x.next`, `x.pipe`)? Not a value lift.
        if (ts.isPropertyAccessExpression(p) && p.expression === n && !memberTargetsValue(n, p.name.text)) { ok = false; return; }
        // An alias roots in its synthetic item param, so fields of one destructured
        // item collapse to a single root (and so to one map, like `cell.x`).
        names.add(aliasInfo.has(n.text) ? aliasInfo.get(n.text)!.param : n.text);
        return;
      }
      // A non-identifier observable (e.g. a call/chain returning a stream) has no
      // named root to map over — can't collapse.
      if (isObservableExpr(n)) { ok = false; return; }
      ts.forEachChild(n, walk);
    };
    walk(node);
    return ok ? names : null;
  };

  // Generates unique, readable param names within a single lifted expression.
  const freshNamer = () => {
    const used = new Set();
    return (base: string) => {
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
  const V = (node: TS.Node): SrcSlice => ({ srcStart: node.getStart(sf), srcEnd: node.getEnd() });
  // Join several piece-lists with a separator string.
  const joinPieces = (groups: Piece[][], sep: string): Piece[] => groups.flatMap((g, i) => (i === 0 ? g : [sep, ...g]));
  // Coerce a (possibly non-observable) operand into an observable source for
  // combineLatest / switchMap: leave observables as-is, wrap plain values in of().
  const asStream = (operand: Operand): Piece[] => {
    if (operand.observable) return operand.pieces;
    needed.rxjs.add('of');
    return ['of(', ...operand.pieces, ')'];
  };
  // Combine `sources` (each a stream's pieces) and map their emitted values —
  // bound to `params` — through `body`. A single source needs no combineLatest:
  // it collapses to `source.pipe(map(param => body))` (the same single-root
  // shape D5 produces), which is tighter and imports one fewer operator.
  const combineMap = (sources: Piece[][], params: string[], body: Piece[]): Piece[] => {
    needed['rxjs/operators'].add('map');
    if (sources.length === 1) return [...sources[0], '.pipe(map(', params[0], ' => ', ...body, '))'];
    needed.rxjs.add('combineLatest');
    return ['combineLatest([', ...joinPieces(sources, ', '), ']).pipe(map(([', params.join(', '), ']) => ', ...body, '))'];
  };
  // Emit `node` verbatim (as source slices) but rewrite each alias VALUE reference
  // to `param.prop`. Used where a node is re-emitted inside a `map(param => …)` whose
  // param is the shared item — the D3 ternary body and a handler closure body — so
  // the destructured names resolve to members of the bound item. With no aliases
  // present it returns a single verbatim slice, identical to `[V(node)]`.
  const expandAliases = (node: TS.Node, root?: { name: string; key: string }): Piece[] => {
    // Collect alias (D4) value references, and — when `root` (a real observable
    // identifier) is given — its value occurrences too (D5), in source order.
    const occ: { id: TS.Identifier; alias: boolean }[] = [];
    const walk = (n: TS.Node) => {
      if (ts.isIdentifier(n)) {
        const p = n.parent;
        if (ts.isPropertyAccessExpression(p) && p.name === n) return;            // a property name
        if (ts.isQualifiedName(p) && p.right === n) return;
        if ((ts.isPropertyAssignment(p) || ts.isBindingElement(p) || ts.isParameter(p)) && p.name === n) return;
        if (ts.isShorthandPropertyAssignment(p)) return;                         // `{ color }` — leave (rare)
        if (aliasInfo.has(n.text)) { occ.push({ id: n, alias: true }); return; }
        if (root && n.text === root.name && isObservableExpr(n)) { occ.push({ id: n, alias: false }); return; }
        return;
      }
      ts.forEachChild(n, walk);
    };
    walk(node);
    if (!occ.length) return [V(node)];
    occ.sort((a, b) => a.id.getStart(sf) - b.id.getStart(sf));
    const pieces: Piece[] = [];
    let cursor = node.getStart(sf);
    for (const { id, alias } of occ) {
      if (id.getStart(sf) > cursor) pieces.push({ srcStart: cursor, srcEnd: id.getStart(sf) });
      if (alias) {
        const { param, prop, cbId } = aliasInfo.get(id.text)!;
        // Source-slice the prop token (when not renamed) so the field keeps hover / nav.
        pieces.push(param, '.', id.text === prop
          ? { srcStart: id.getStart(sf), srcEnd: id.getEnd(), aliasKey: `${cbId}:${id.text}` }
          : prop);
      } else {
        // Real root: emit the map param as generated text and record the source span,
        // so it maps onto the outer stream reference (Observable type) — not the param.
        rootMappings.push({ srcStart: id.getStart(sf), len: id.getEnd() - id.getStart(sf), key: root!.key });
        pieces.push(root!.name);
      }
      cursor = id.getEnd();
    }
    if (cursor < node.getEnd()) pieces.push({ srcStart: cursor, srcEnd: node.getEnd() });
    return pieces;
  };

  // When every observable in `node` roots in a single identifier `x`, the whole
  // expression lifts as one `x.pipe(map(x => <verbatim>))` — no combineLatest, and
  // the body runs as plain code so TS narrowing is preserved. Shared by the ternary
  // (D3) and the operator lifts (D5). `expandAliases` rewrites any destructured
  // field to `x.prop` (D4); with none it's just the verbatim expression. Returns
  // null when there's no single root (zero observables, or several distinct ones).
  const singleRootLift = (node: TS.Node, callable?: boolean): Operand | null => {
    const roots = observableRoots(node);
    if (!roots || roots.size !== 1) return null;
    const x = [...roots][0];
    needed['rxjs/operators'].add('map');
    const key = `c:${collapseSeq++}`;
    const body = expandAliases(node, { name: x, key });
    // The outer `x` is the actual stream; tag its generated position so the root's
    // source occurrences (now the map param in `body`) hover/navigate to it — showing
    // `Observable<…>`, the variable's real type. (For an alias root the param is
    // synthetic, has no source occurrences, and the tag is simply unused.)
    // `callable` mirrors the eager path: arithmetic/comparison/unary emit primitives
    // (false), ternary/logical leave it unknown (undefined). It marks the binding
    // non-callable so a later `binding(...)` surfaces as a boundary teaching message.
    return { pieces: [{ gen: x, refKey: key }, '.pipe(map(', x, ' => ', ...body, '))'], observable: true, lifted: true, callable };
  };

  function transformExpression(node: TS.Node): Operand {
    // A destructured field (D4) read as a value lifts exactly like the member
    // access it stands for: `color` → `item.pipe(map(item => item.color))`.
    if (ts.isIdentifier(node) && aliasInfo.has(node.text)) {
      const { param, prop, cbId } = aliasInfo.get(node.text)!;
      needed['rxjs/operators'].add('map');
      // Map the generated `.prop` token back to the source field identifier (same
      // text when not renamed) so hover / go-to-def work on the destructured name.
      // `aliasKey` lets the declaration site borrow this same generated token.
      const propPiece = node.text === prop
        ? { srcStart: node.getStart(sf), srcEnd: node.getEnd(), aliasKey: `${cbId}:${node.text}` }
        : prop;
      return { pieces: [param, '.pipe(map(', param, ' => ', param, '.', propPiece, '))'], observable: true, lifted: true };
    }
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
      // D3 — preserve narrowing: if every observable in the ternary roots in one
      // identifier (so no branch is a separate stream — a component branch like
      // `Div`…`` roots elsewhere and disqualifies this), lift the whole ternary as
      // one `x.pipe(map(x => <verbatim>))`, so a guard like `x === undefined` narrows
      // `x` in its branch — exactly as it would without Reactive TS.
      const collapsed = singleRootLift(node);
      if (collapsed) return collapsed;
      const cond = transformExpression(node.condition);
      const whenTrue = transformExpression(node.whenTrue);
      const whenFalse = transformExpression(node.whenFalse);
      if (cond.observable) {
        needed['rxjs/operators'].add('switchMap');
        const param = ts.isIdentifier(node.condition) ? node.condition.text : '_cond';
        // A branch that IS the condition identifier refers to the *current value* in
        // the switchMap body — the param shadows the outer stream — not the stream
        // itself. Re-emit it as `of(param)` (a valid ObservableInput), exactly as the
        // logical-operator lift re-emits its left value (`keep = of(p)` above). Emitting
        // it bare leaves a non-stream branch (`flag ? flag : …` → `boolean`), which isn't
        // switchMap-able and type-errors. Any *other* observable branch is a genuine
        // stream to switch to (left verbatim); a non-observable branch gets the usual
        // of() wrap. This is what lets a self-referential `cond ? cond : EMPTY` lift
        // correctly while still switch-mapping to an external observable branch.
        const branch = (operand: Operand, branchNode: TS.Expression): Piece[] => {
          if (ts.isIdentifier(branchNode) && branchNode.text === param) {
            needed.rxjs.add('of');
            return ['of(', param, ')'];
          }
          return asStream(operand);
        };
        // switchMap for laziness; the render() wrapper (added at the binding)
        // provides the shareReplay, so we don't add it here.
        const pieces = [
          ...cond.pieces, '.pipe(switchMap(', param, ' => ', param, ' ? ',
          ...branch(whenTrue, node.whenTrue), ' : ', ...branch(whenFalse, node.whenFalse), '))',
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
        const fresh = freshNamer();
        const sources: Piece[][] = [];
        const params: string[] = [];
        const subs: { inline?: Piece[]; param?: string }[] = spans.map(s => {
          if (!s.expr.observable) return { inline: s.expr.pieces };
          const p = fresh(ts.isIdentifier(s.node) ? s.node.text : '_e');
          sources.push(s.expr.pieces);
          params.push(p);
          return { param: p };
        });
        const body: Piece[] = [V(node.head)];
        spans.forEach((s, i) => {
          const sub = subs[i];
          body.push(...(sub.param ? [sub.param] : sub.inline!));
          body.push(V(s.literal));
        });
        return { pieces: combineMap(sources, params, body), observable: true, lifted: true, callable: false };
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
          const body = [objParam, '.', V(ex.name), '(', ...joinPieces(callArgs, ', '), ')'];
          return { pieces: combineMap(sources, params, body), observable: true, lifted: true };
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
      const liftableArg = args.map((a, i) => a.observable && !paramAcceptsObservable(node, i));
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
        const fresh = freshNamer();
        const argParam = (argNode: TS.Node, i: number) => fresh(ts.isIdentifier(argNode) ? argNode.text : `_a${i}`);

        if (calleeIsFnStream) {
          const fnParam = fresh(ts.isIdentifier(node.expression) ? node.expression.text : '_fn');
          const argParams = node.arguments.map(argParam);
          const sources = [callee.pieces, ...args.map(asStream)];
          const params = [fnParam, ...argParams];
          const pieces = combineMap(sources, params, [fnParam, '(', argParams.join(', '), ')']);
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
        const params: string[] = [];
        const sources: Piece[][] = [];
        const callArgs = node.arguments.map((argNode, i) => {
          if (!liftableArg[i]) return args[i].pieces;
          const p = argParam(argNode, i);
          params.push(p);
          sources.push(asStream(args[i]));
          return [p];
        });
        const pieces = combineMap(sources, params, [...callee.pieces, '(', ...joinPieces(callArgs, ', '), ')']);
        // Plain function over observable args: emits the function's return value.
        // The callee is a real (non-observable) function, so its type is reliable.
        const calleeReturn = returnTypeOf(checker.getTypeAtLocation(node.expression));
        const callable = typeIsCallable(calleeReturn);
        // Higher-order trap: if the function itself RETURNS an observable (e.g.
        // `timer(0, period)` over an observable period), mapping over the lifted arg
        // produces Observable<Observable<…>> — a stream of streams that never flattens.
        // It type-checks, so nothing else warns; record the span so the editor can.
        if (isObservableType(calleeReturn)) {
          higherOrder.push({
            start: node.getStart(sf),
            length: node.getEnd() - node.getStart(sf),
            name: ts.isIdentifier(node.expression) ? node.expression.text : null,
          });
        }
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
          // Two distinct streams (object + index) → always a genuine combineLatest,
          // never the single-source collapse, so it's emitted directly not via combineMap.
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
      // Single-root (D5): both sides root in one stream, so there's nothing to keep
      // lazy — one map preserves short-circuit semantics as plain JS.
      const collapsed = singleRootLift(node);
      if (collapsed) return collapsed;
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
      // Single-root (D5): collapse `!user.active` to one map over `user`, not a
      // member-access map piped into a unary map. Emits a primitive → non-callable.
      const collapsed = singleRootLift(node, false);
      if (collapsed) return collapsed;
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
      // Single-root (D5): `count * 2`, `tick % 2 === 0`, `selected === option` all
      // root in one stream → one map instead of (nested) combineLatest. Emits a
      // primitive, so it's non-callable.
      const collapsed = singleRootLift(node, false);
      if (collapsed) return collapsed;
      const left = transformExpression(node.left);
      const right = transformExpression(node.right);
      if (left.observable || right.observable) {
        // singleRootLift above already collapsed the single-root case, so reaching
        // here means two distinct operand streams → a genuine combineLatest, not
        // the single-source combineMap path.
        needed.rxjs.add('combineLatest');
        needed['rxjs/operators'].add('map');
        noteStall(node.left);
        noteStall(node.right);
        const used = new Set();
        const paramOf = (operandNode: TS.Node, i: number) => {
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
  // A synthetic stream-param name (default base `item`) for a destructured item param
  // (D4) or the flatMap flatten operator, chosen so it collides with neither an outer
  // observable binding nor any identifier in `scope` (the callback's destructured
  // fields, index param, locals, free references).
  const freshItemName = (scope: TS.Node, base = 'item') => {
    const used = new Set(observableBindings);
    const collect = (n: TS.Node) => { if (ts.isIdentifier(n)) used.add(n.text); ts.forEachChild(n, collect); };
    collect(scope);
    let name = base, n = 1;
    while (used.has(name)) name = `${base}_${n++}`;
    return name;
  };

  // A parameter `{ a, b }` qualifies for the destructured-stream rebind only when every
  // field is a plain binding — no rest, default, computed name, or nesting (the same
  // restriction the component-`.map` item param uses).
  const qualifiesDestructure = (param: TS.ParameterDeclaration | undefined): boolean =>
    Boolean(param) && ts.isObjectBindingPattern(param!.name)
    && param!.name.elements.every(el =>
      !el.dotDotDotToken && !el.initializer && ts.isIdentifier(el.name)
      && (!el.propertyName || ts.isIdentifier(el.propertyName)));

  // Rebind a destructured stream param to a synthetic name and register each field as an
  // alias that lifts to `synthetic.field` wherever it's read (D4). The undo entries are
  // pushed onto `addedBindings`/`addedAliases` so the caller can unscope after visiting
  // the body. Replaces only the binding NAME, so an explicit `: Observable<T>` annotation
  // survives (a component-`.map` item param is untyped, so name and param spans coincide).
  const bindDestructure = (
    param: TS.ParameterDeclaration, scope: TS.Node,
    addedBindings: string[], addedAliases: [string, AliasInfo | undefined][],
  ) => {
    const synthetic = freshItemName(scope);
    const cbId = cbSeq++;
    edits.push({ start: param.name.getStart(sf), end: param.name.getEnd(), pieces: [synthetic] });
    observableBindings.add(synthetic); addedBindings.push(synthetic);
    for (const el of (param.name as TS.ObjectBindingPattern).elements) {
      const prop = (el.propertyName || el.name).getText(sf);
      const key = (el.name as TS.Identifier).text;
      addedAliases.push([key, aliasInfo.has(key) ? aliasInfo.get(key) : undefined]);
      aliasInfo.set(key, { param: synthetic, prop, cbId });
      // Non-renamed field: its declaration token can borrow a use's generated `item.prop`
      // token for hover. (A renamed `{ a: b }` use emits a plain string prop — no
      // source-mapped token to point at — so it's left unmapped.)
      if (!el.propertyName) declMappings.push({
        aliasKey: `${cbId}:${key}`, srcStart: el.name.getStart(sf), len: el.name.getEnd() - el.name.getStart(sf),
      });
    }
  };

  const handleComponentMap = (node: TS.CallExpression) => {
    // The caller only reaches here via isComponentMapCall, which has already verified
    // the receiver is `obj.map` / `obj.flatMap` and the first arg is an arrow/function.
    const ex = node.expression as TS.PropertyAccessExpression;  // obj.map / obj.flatMap
    const obj = ex.expression;                                  // obj
    const cb = node.arguments[0] as TS.ArrowFunction | TS.FunctionExpression;
    const isFlat = ex.name.text === 'flatMap';
    needed.rxfm.add('mapToComponents');
    // Lift the receiver if it's itself an imperative expression (e.g. a filter).
    const objR = transformExpression(obj);
    if (objR.lifted) edits.push({ start: obj.getStart(sf), end: obj.getEnd(), pieces: objR.pieces });
    // `.map(` → `.pipe(mapToComponents(`, final `)` → `))`. The `map` token is
    // *remapped* (not swallowed) to the generated `mapToComponents` identifier so
    // hovering `.map` shows mapToComponents' signature/docs rather than nothing.
    // `.flatMap(` additionally flattens the source one level first, so the cb maps each
    // leaf of a nested array: `.flatMap(` → `.pipe(map(a => a.flat()), mapToComponents(`.
    // (`.flat()` is a no-op on an already-flat array, so this is safe regardless.)
    if (isFlat) {
      needed['rxjs/operators'].add('map');
      const f = freshItemName(node, 'arr');
      edits.push({ start: obj.getEnd(), end: ex.name.getStart(), pieces: [`.pipe(map(${f} => ${f}.flat()), `] });
    } else {
      edits.push({ start: obj.getEnd(), end: ex.name.getStart(), pieces: ['.pipe('] });
    }
    edits.push({ start: ex.name.getStart(), end: ex.name.getEnd(), remap: 'mapToComponents' });
    edits.push({ start: node.getEnd() - 1, end: node.getEnd(), pieces: ['))'] });
    // Lift the callback body with its params treated as observables, scoped so the
    // marking doesn't leak past this callback.
    const addedBindings: string[] = [];
    const addedAliases: [string, AliasInfo | undefined][] = [];
    // D4: the item param may be destructured — `({ color, symbol }, i) => …`. The
    // binding pattern can't survive (mapToComponents passes an Observable item, not
    // the value), so rebind it to a synthetic stream param and lift its fields. Here
    // the item is contextually a stream, so no `Observable<T>` annotation is required.
    const itemParam = cb.parameters[0];
    const destructures = qualifiesDestructure(itemParam);
    if (destructures) bindDestructure(itemParam, cb, addedBindings, addedAliases);
    // Remaining params (and a non-destructured item param) → plain observable bindings.
    for (let i = destructures ? 1 : 0; i < cb.parameters.length; i++) {
      const name = cb.parameters[i].name.getText(sf);
      if (!observableBindings.has(name)) { observableBindings.add(name); addedBindings.push(name); }
    }
    visit(cb.body);
    addedBindings.forEach(p => observableBindings.delete(p));
    for (const [key, prev] of addedAliases) prev ? aliasInfo.set(key, prev) : aliasInfo.delete(key);
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
  const within = (node: TS.Node, ancestor: TS.Node) => node.getStart(sf) >= ancestor.getStart(sf) && node.getEnd() <= ancestor.getEnd();
  const collectHandlerCaptures = (fnNode: TS.ArrowFunction | TS.FunctionExpression) => {
    // A captured stream is lifted only if the handler reads it as a *value*. If it's
    // touched via its stream API (`subject.next(…)`, `.value`, `.pipe`), the handler
    // legitimately operates on the stream itself — lifting would replace it with a
    // value and break the call — so such names are excluded entirely.
    const valueUsed = new Map();
    const streamUsed = new Set();
    const walk = (n: TS.Node) => {
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
  const liftHandlerClosure = (fnNode: TS.ArrowFunction | TS.FunctionExpression): Piece[] | null => {
    const names = [...collectHandlerCaptures(fnNode).keys()];
    if (!names.length) return null;
    // A captured alias (D4) is sourced from its shared item param, deduped, and its
    // fields are expanded in the body — so `() => f(color)` over a destructured
    // `{ color }` lifts to `item.pipe(map(item => () => f(item.color)))`.
    const sources: string[] = [];
    const seen = new Set<string>();
    for (const name of names) {
      const src = aliasInfo.has(name) ? aliasInfo.get(name)!.param : name;
      if (seen.has(src)) continue;
      seen.add(src);
      sources.push(src);
    }
    // The captured streams are both the sources and the map params (re-bound to
    // their current values inside the handler body).
    return combineMap(sources.map(s => [s]), sources, expandAliases(fnNode));
  };

  // Lift variable initializers anywhere — including inside function bodies, since
  // a component is a function. Walk top-down so declarations are seen in source
  // order (so a binding is known observable before later statements use it).
  const visit = (node: TS.Node) => {
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
      //
      // A bare-identifier source (`= game`) is read directly. A larger expression
      // (`= accumulate(…) ?? getInitialGame()`) can't be: textually repeating it in
      // every field would subscribe it once per field (each re-running its own scan).
      // So it's first hoisted into one synthetic binding — `item = render(<expr>)` —
      // and the fields fan off that (shared via render, subscribed once). render is
      // idempotent, so an expression that's already a RenderObservable isn't re-wrapped.
      if (ts.isObjectBindingPattern(node.name)) {
        const initR = transformExpression(node.initializer);
        // Only plain-field patterns qualify (no rest, defaults, computed, or nesting).
        const fieldsQualify = node.name.elements.every(el =>
          !el.dotDotDotToken && !el.initializer && ts.isIdentifier(el.name)
          && (!el.propertyName || ts.isIdentifier(el.propertyName)));
        if (initR.observable && fieldsQualify) {
          needed['rxjs/operators'].add('map');
          usedRender = true;
          const isId = ts.isIdentifier(node.initializer);
          // The map param and the in-field source reference. For an identifier source
          // both are the source itself (mapped back so hover resolves it); otherwise a
          // fresh synthetic name bound to the hoisted `render(<expr>)`.
          const param = isId ? (node.initializer as TS.Identifier).text : freshItemName(node);
          const ref: Piece = isId ? V(node.initializer) : param;
          const fields = node.name.elements.map(el => {
            const prop = (el.propertyName || el.name).getText(sf);
            observableBindings.add((el.name as TS.Identifier).text);
            return [V(el.name), ' = render(', ref, `.pipe(map(${param} => ${param}.${prop})))`];
          });
          // For a non-identifier source, prepend the hoisted binding and reserve its
          // name (so a sibling destructure picks a distinct synthetic, not a redeclare).
          let groups: Piece[][] = fields;
          if (!isId) {
            observableBindings.add(param);
            const srcPieces = initR.lifted || initR.rewritten ? initR.pieces : [V(node.initializer)];
            groups = [[param, ' = render(', ...srcPieces, ')'], ...fields];
          }
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
    // A standalone function whose parameter is an explicitly typed `Observable<T>`
    // destructured in place — `const TodoItem = ({ name, done }: Observable<TodoItem>) => …`.
    // Rebind the pattern to a synthetic stream param and lift its fields in the body,
    // exactly as a component-`.map` item param does. Gated on the explicit annotation:
    // unlike a map callback (where the item is contextually a stream), a named function
    // can be called from anywhere, so the stream intent must be declared, not inferred —
    // and without it the binding is just ordinary value destructuring, left untouched.
    // (Map callbacks never reach here: handleComponentMap visits their body directly.)
    if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)
      || ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.body) {
      const streamParams = node.parameters.filter(p =>
        qualifiesDestructure(p) && p.type && isObservableType(checker.getTypeFromTypeNode(p.type)));
      if (streamParams.length) {
        const addedBindings: string[] = [];
        const addedAliases: [string, AliasInfo | undefined][] = [];
        for (const p of streamParams) bindDestructure(p, node, addedBindings, addedAliases);
        visit(node.body);
        addedBindings.forEach(b => observableBindings.delete(b));
        for (const [key, prev] of addedAliases) prev ? aliasInfo.set(key, prev) : aliasInfo.delete(key);
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // Assemble the planned edits into generated code + the source↔generated
  // position map. Everything above is the PLANNING phase (deciding what to
  // rewrite); this is the EMIT phase (splicing it together).
  const { code, segments } = assembleOutput({
    ts, sf, sourceText, baseDir, edits, needed, usedRender, declMappings, rootMappings,
  });

  const sourceDiagnostics = ts.getPreEmitDiagnostics(program).filter(d => d.file && d.file.fileName === fileName);
  return { code, segments, sourceDiagnostics, stalls, higherOrder };
}

// Re-export the public API (transformWithMappings is exported inline above). The
// mapping utilities and compiler options live in their own modules; surfacing them
// here keeps `require('./transform.cjs')` the single entry point consumers use.
export { mapSourceToGenerated, segmentsToVolarMappings, getCompilerOptions };
