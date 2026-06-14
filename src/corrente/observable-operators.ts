// Fluent operator methods on `Observable`, mirroring the WICG Observable proposal
// (https://github.com/WICG/observable) so a Corrente stream reads the way the platform
// is heading: `source.map(...).filter(...).takeUntil(stop)` rather than
// `source.pipe(map(...), filter(...), takeUntil(stop))`.
//
// Importing this module augments `Observable.prototype` once (a deliberate global
// patch - every Corrente stream, component, and `State` then carries the methods).
// Each definition is guarded so a future native/RxJS `Observable` that already
// provides the method wins; the patch is non-enumerable like a real prototype method.
//
// Scope, matching the proposal analysis in reactive-ts/ROADMAP.md:
//
// - We add the proposal's **Observable-returning** operators (`map`, `filter`, `take`,
//   `drop`, `takeUntil`, `catch`, `finally`, `flatMap`). They match the spec exactly and
//   are just `pipe()` one-liners, so they return **plain** `Observable`s - lossless and
//   cold, not the shared/distinct `RenderObservable` the transform's `render()` produces.
//   That keeps "render() is what makes a stream shared + distinct-by-reference" the single
//   boundary, and keeps these faithful to the proposal.
// - We deliberately **omit** the proposal's terminal, Promise-returning operators
//   (`reduce`, `toArray`, `forEach`, `some`, `every`, `find`). They fire on `complete()`,
//   and Corrente streams (components, `State`) never complete - the Promise would never
//   resolve. Leaving `reduce` off also keeps it from being mistaken for a running fold
//   (use `scan` / `accumulate` for that).
// - We add `scan` (running fold; appendix material in the proposal, proposal-aligned shape)
//   and `debounce` / `throttle` (lossy time operators; beyond the proposal's current scope,
//   named after the lodash vocabulary people already carry). These are marked below so they
//   can be re-pointed if/when the platform standardises them.
import { Observable, ObservableInput } from "rxjs";
import {
  catchError,
  debounceTime,
  filter,
  finalize,
  map,
  mergeMap,
  scan,
  skip,
  take,
  takeUntil,
  throttleTime,
} from "rxjs/operators";

declare module "rxjs" {
  interface Observable<T> {
    /** Map each value through `project` (lossless, 1:1). WICG `Observable.map`. */
    map<R>(project: (value: T, index: number) => R): Observable<R>;
    /** Keep only the values matching `predicate`. WICG `Observable.filter`. */
    filter<R extends T>(
      predicate: (value: T, index: number) => value is R,
    ): Observable<R>;
    filter(predicate: (value: T, index: number) => boolean): Observable<T>;
    /** Take the first `count` values, then complete. WICG `Observable.take`. */
    take(count: number): Observable<T>;
    /** Skip the first `count` values. WICG `Observable.drop` (RxJS `skip`). */
    drop(count: number): Observable<T>;
    /** Mirror the source until `notifier` emits, then complete. WICG `Observable.takeUntil`. */
    takeUntil(notifier: ObservableInput<unknown>): Observable<T>;
    /** Recover from an error by switching to the observable `handler` returns. WICG `Observable.catch` (RxJS `catchError`). */
    catch(handler: (error: unknown) => ObservableInput<T>): Observable<T>;
    /** Run `callback` on completion, error, or unsubscription. WICG `Observable.finally` (RxJS `finalize`). */
    finally(callback: () => void): Observable<T>;
    /** Map each value to an observable and flatten by merging. WICG `Observable.flatMap`. (Verify concurrency against the final spec.) */
    flatMap<R>(
      project: (value: T, index: number) => ObservableInput<R>,
    ): Observable<R>;
    /**
     * Running fold - emit the accumulation on every value (RxJS `scan`). Not in the
     * initial WICG cut (appendix material); shaped to align with it. Emits on the first
     * *source* value, not on subscribe, so a `State`/immediate source shows on load while
     * a silent `Subject` stays quiet - see {@link accumulate} for the null-first variant.
     */
    scan<A>(
      accumulator: (acc: A, value: T, index: number) => A,
      seed: A,
    ): Observable<A>;
    /** Emit a value only after `durationMs` of silence (RxJS `debounceTime`). Beyond the current WICG proposal. */
    debounce(durationMs: number): Observable<T>;
    /** Emit at most one value per `durationMs` window (RxJS `throttleTime`). Beyond the current WICG proposal. */
    throttle(durationMs: number): Observable<T>;
  }
}

type ObservableMethod = (this: Observable<unknown>, ...args: any[]) => unknown;

/**
 * Install `impl` as `Observable.prototype[name]`, unless something already defines it
 * (so a native/RxJS `Observable` that ships these methods takes precedence).
 * Non-enumerable, configurable, and writable - like a real prototype method.
 */
function defineObservableMethod(name: string, impl: ObservableMethod): void {
  if (name in Observable.prototype) return;
  Object.defineProperty(Observable.prototype, name, {
    value: impl,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

defineObservableMethod("map", function (project) {
  return this.pipe(map(project));
});
defineObservableMethod("filter", function (predicate) {
  return this.pipe(filter(predicate));
});
defineObservableMethod("take", function (count) {
  return this.pipe(take(count));
});
defineObservableMethod("drop", function (count) {
  return this.pipe(skip(count));
});
defineObservableMethod("takeUntil", function (notifier) {
  return this.pipe(takeUntil(notifier));
});
defineObservableMethod("catch", function (handler) {
  return this.pipe(catchError(handler));
});
defineObservableMethod("finally", function (callback) {
  return this.pipe(finalize(callback));
});
defineObservableMethod("flatMap", function (project) {
  return this.pipe(mergeMap(project));
});
defineObservableMethod("scan", function (accumulator, seed) {
  return this.pipe(scan(accumulator, seed));
});
defineObservableMethod("debounce", function (durationMs) {
  return this.pipe(debounceTime(durationMs));
});
defineObservableMethod("throttle", function (durationMs) {
  return this.pipe(throttleTime(durationMs));
});
