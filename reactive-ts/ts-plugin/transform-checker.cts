// The transform's CHECKER PREDICATES — its questions about the source, answered by
// the real type checker plus the small slice of tracked-binding state the checker
// can't see post-transform. Three layers:
//   - pure type queries (isObservableType, observableValueType, typeIsCallable, …)
//     read only a `ts.Type`;
//   - observability of an EXPRESSION (isObservableExpr, isObservableChain) also
//     consults the tracked bindings/aliases;
//   - structural recognizers (returnsComponent, isComponentMapCall) classify a node
//     by what it would produce.
//
// `createChecker` binds them to one transform run's `ts`/`checker`/`sf` and its
// mutable state. The state is held by reference, so bindings the planning phase adds
// later (and stalls it records) are visible here — the orchestrator destructures the
// returned object so call sites read as plain predicates.
'use strict';
import type * as TS from 'typescript';
import type { Ts, AliasInfo, Stall } from './transform-types.cjs';

/** The slice of the transform's mutable state the predicates read/write. Passed by
 *  reference: `observableBindings` grows as the planning phase descends, and
 *  `noteStall` appends to `stalls`. */
export interface CheckerState {
  observableBindings: Set<string>;
  aliasInfo: Map<string, AliasInfo>;
  maybeEmptyBindings: Set<string>;
  nonCallableBindings: Set<string>;
  stalls: Stall[];
}

export function createChecker(ts: Ts, checker: TS.TypeChecker, sf: TS.SourceFile, state: CheckerState) {
  const { observableBindings, aliasInfo, maybeEmptyBindings, nonCallableBindings, stalls } = state;

  const isObservableType = (type: TS.Type | undefined): boolean => {
    if (!type) return false;
    if (type.isUnion && type.isUnion()) return type.types.some(isObservableType);
    return Boolean(type.getProperty && type.getProperty('subscribe') && type.getProperty('pipe'));
  };
  const isObservableExpr = (node: TS.Node): boolean =>
    (ts.isIdentifier(node) && (observableBindings.has(node.text) || aliasInfo.has(node.text))) ||
    isObservableType(checker.getTypeAtLocation(node));

  // Does parameter `argIndex` of this call accept an Observable? Two callers ask
  // this for different reasons: an operator-style call whose stream argument must
  // pass through verbatim (not be mapped per emission), and an EventHandler slot
  // (`handler | Observable<handler>`) that takes a lifted handler stream (D2).
  const paramAcceptsObservable = (callNode: TS.CallLikeExpression, argIndex: number) => {
    const sig = checker.getResolvedSignature(callNode);
    if (!sig) return false;
    const params = sig.getParameters();
    if (!params.length) return false;
    const pSym = params[Math.min(argIndex, params.length - 1)];
    return Boolean(pSym) && isObservableType(checker.getTypeOfSymbolAtLocation(pSym, callNode));
  };

  // The value type T of an Observable<T>/RenderObservable<T>, or undefined if the
  // type isn't an observable. Reads the type's first type argument.
  const observableValueType = (type: TS.Type | undefined): TS.Type | undefined => {
    if (!type) return undefined;
    if (type.isUnion && type.isUnion()) {
      for (const t of type.types) {
        const v = observableValueType(t);
        if (v) return v;
      }
      return undefined;
    }
    if (!isObservableType(type)) return undefined;
    let args: readonly TS.Type[] | undefined;
    try { args = checker.getTypeArguments(type as TS.TypeReference); } catch { args = (type as TS.TypeReference).typeArguments; }
    return args && args.length ? args[0] : undefined;
  };

  // Does this expression evaluate to an observable that completes WITHOUT emitting
  // (RxJS `EMPTY`, i.e. Observable<never>)? Used to spot the `cond ? x : EMPTY`
  // filter idiom so we can flag the resulting binding as maybe-empty.
  const emitsNever = (node: TS.Node) => {
    const value = observableValueType(checker.getTypeAtLocation(node));
    return Boolean(value && value.flags & ts.TypeFlags.Never);
  };

  // Record a "stall" warning when an operand fed into a combineLatest is a
  // maybe-empty binding: combineLatest waits for every source's first emission, so a
  // source that can stay EMPTY freezes the whole derived value until (if ever) it
  // emits. The `cond ? x : EMPTY` filter idiom is fine standalone (as a child) but
  // hazardous when combined — this teaches that exactly where it happens.
  const noteStall = (node: TS.Node) => {
    if (ts.isIdentifier(node) && maybeEmptyBindings.has(node.text)) {
      stalls.push({ start: node.getStart(sf), length: node.getEnd() - node.getStart(sf), name: node.text });
    }
  };

  // Would calling this expression be a boundary violation rather than a real
  // "observable emitting a function"? True when the callee is a stream whose
  // emitted value can't be called: a binding we lifted to a non-callable value,
  // or a checker-visible observable whose T has no call signatures.
  const calleeEmitsNonCallable = (node: TS.Node) => {
    if (ts.isIdentifier(node) && nonCallableBindings.has(node.text)) return true;
    const valueType = observableValueType(checker.getTypeAtLocation(node));
    if (valueType) return checker.getSignaturesOfType(valueType, ts.SignatureKind.Call).length === 0;
    return false;
  };

  const typeIsCallable = (type: TS.Type | undefined) =>
    type ? checker.getSignaturesOfType(type, ts.SignatureKind.Call).length > 0 : false;
  // The return type of a callable type's first call signature, or undefined.
  const returnTypeOf = (type: TS.Type | undefined): TS.Type | undefined => {
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
  const memberTargetsValue = (objNode: TS.Node, name: string) => {
    const t = checker.getTypeAtLocation(objNode);
    if (isObservableType(t)) return !t.getProperty(name);
    return !STREAM_MEMBERS.has(name);
  };

  // Structural test for a DOM element type — RxFM components emit these.
  const isElementValueType = (type: TS.Type | undefined) =>
    Boolean(type && type.getProperty && type.getProperty('nodeType') &&
      (type.getProperty('tagName') || type.getProperty('nodeName')));

  // Does this function expression return a component (an Observable of a DOM
  // element)? Excludes `any` (which a value-mapping callback gets, since its item
  // param is untyped once `.map` fails to resolve on Observable). Reliable because
  // component creators (Div, …) are typed regardless of the item param.
  const returnsComponent = (fnNode: TS.SignatureDeclaration) => {
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
  const isObservableChain = (node: TS.Node | undefined): boolean => {
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
  const isComponentMapCall = (node: TS.Node): node is TS.CallExpression => {
    if (!ts.isCallExpression(node) || node.arguments.length < 1) return false;
    const ex = node.expression;
    if (!ts.isPropertyAccessExpression(ex) || ex.name.text !== 'map') return false;
    const cb = node.arguments[0];
    if (!ts.isArrowFunction(cb) && !ts.isFunctionExpression(cb)) return false;
    return isObservableChain(ex.expression) && returnsComponent(cb);
  };

  return {
    isObservableType, isObservableExpr, paramAcceptsObservable, observableValueType,
    emitsNever, noteStall, calleeEmitsNonCallable, typeIsCallable, returnTypeOf,
    memberTargetsValue, isElementValueType, returnsComponent, isObservableChain, isComponentMapCall,
  };
}
