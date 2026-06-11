// The Reactive TS runtime, shipped as part of corrente. The Reactive TS transform emits `render(...)`
// around lifted expressions and leaves `accumulate` / `interval` / `fallback` / `EMPTY` for
// you to call by hand; all of them live here. They're useful with plain corrente too — a
// shared/replaying derived value (`render`), a running fold (`accumulate`), a
// reactive-period clock (`interval`), and an error boundary (`fallback`) — so they sit on
// the public `corrente` surface.
//
// A single indirection point also lets the underlying observable implementation
// (RxJS today, possibly a native/RxJS-8 Observable later) change without touching
// emitted code shape.
import { EMPTY, Observable, isObservable, of, timer } from "rxjs";
import {
  catchError,
  distinctUntilChanged,
  scan,
  shareReplay,
  startWith,
  switchMap,
} from "rxjs/operators";

// Re-exported so the filter idiom `cond ? value : EMPTY` needs only one Reactive TS import:
// a ternary whose else-branch is EMPTY drops the value when the condition is false
// (the imperative spelling of RxJS `filter`).
export { EMPTY };

// Re-exported on the runtime surface because the transform emits it: lifting a lookup
// table whose values are `TypeOrObservable<T>` (mix of plain values and streams) over an
// observable key flattens with `switchMap(k => coerceToObservable(MAP[k]))`. Sourced from
// the runtime (not `corrente` directly) so generated code depends only on the runtime seam —
// keeping the option open to split Reactive TS out from corrente later.
export { coerceToObservable } from "./utils/utils";

/**
 * The observable type produced by imperative Reactive TS syntax — a "RenderObservable".
 *
 * Behaviourally it's a shared, replaying observable that only re-emits when its
 * value actually changes: one upstream subscription is shared across subscribers,
 * late subscribers immediately receive the latest value, and consecutive emissions
 * equal by reference (`===`) are dropped. The distinct-by-reference step makes it
 * behave like React — deriving from a value that didn't change is a no-op, so the
 * DOM isn't touched needlessly. It exists as a *distinct type* so the imperative/
 * explicit boundary is visible — `RenderObservable<T>` in a hover means "produced
 * by imperative syntax"; `Observable<T>` means "a raw stream written explicitly".
 *
 * It's also the seam for future render-time behaviour (pending/error state,
 * teardown tied to component lifecycle rather than subscriber refcount). Those
 * can be added here without changing emitted code, since the transform always
 * emits `render(...)`.
 */
export class RenderObservable<T> extends Observable<T> {
  constructor(source: Observable<T>) {
    const shared = source.pipe(
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    super((subscriber) => shared.subscribe(subscriber));
  }
}

/**
 * Wrap an observable as a RenderObservable (shared + replaying). Idempotent —
 * passing an existing RenderObservable returns it unchanged.
 */
export function render<T>(source: Observable<T>): RenderObservable<T> {
  return source instanceof RenderObservable
    ? source
    : new RenderObservable<T>(source);
}

/**
 * Accumulate a stream's values over time, emitting the running result on every
 * emission — the explicit, legible form of stateful folding (RxJS `scan`).
 *
 * The name is deliberate: scan is *not* terminal (unlike `reduce`/`fold`, which
 * collapse to a single value on completion); it reports its accumulation as each
 * value arrives. `accumulate` keeps the familiar `(accumulator, value) => result`
 * shape of array reduce without implying the stream has to end. Because it takes
 * the stream as a parameter, the Reactive TS transform leaves the call untouched (it is
 * operator-style, not a value mapped over emissions).
 *
 * **Emits `null` before the first source value.** RxJS `scan` stays silent until
 * its source emits, which leaves a fold over a not-yet-emitted source (a click
 * `Subject`, say) invisible — and nothing in the types warns you. `accumulate`
 * instead emits `null` up front, so the result is `RenderObservable<A | null>` and
 * every consumer is forced to handle the "no result yet" case. The idiom is nullish
 * coalescing — `accumulate(...) ?? initialValue` to show a default immediately, or
 * leave it `A | null` and let a truthiness guard hide it until the first real value.
 * This separates the fold's *seed* (the accumulator the reducer starts from) from
 * *what to show before any result exists*: e.g. a min-reduction seeds `Infinity`
 * but should render nothing until the first value, which `?? `/guards express and a
 * seed-emitting variant could not.
 *
 * @example
 * // Show a default immediately:
 * const game = accumulate(actions, reduceGame, getInitialGame()) ?? getInitialGame();
 * // Or leave null and hide until the first win (seed `Infinity` stays internal):
 * const best = accumulate(winTimes, Math.min, Infinity);  // best ? `Best: ${best}` : null
 */
export function accumulate<T, A>(
  source: Observable<T>,
  accumulator: (acc: A, value: T) => A,
  seed: A,
): RenderObservable<A | null> {
  return render(source.pipe(scan(accumulator, seed), startWith(null)));
}

/**
 * A clock: emits `0, 1, 2, …`, ticking immediately and then every `period` ms
 * (i.e. `timer(0, period)`, so the first tick fires now rather than after a delay).
 *
 * The point is the reactive overload: pass an `Observable<number>` and the clock
 * restarts at the new rate whenever the period changes — a difficulty-driven game
 * speed Just Works. That restart-on-change is a stream-of-streams switch (build a
 * fresh timer per period, switch to it) — the one shape that lifting fundamentally
 * can't express — so it lives here as a named helper rather than an inline
 * `switchMap(p => timer(0, p))`. A plain `number` behaves like RxJS `interval` but
 * with the immediate first tick.
 *
 * @example
 * const period = periodFor(difficulty);  // RenderObservable<number>
 * const tick = interval(period);         // restarts when difficulty changes
 */
export function interval(
  period: number | Observable<number>,
): Observable<number> {
  const periods = typeof period === "number" ? of(period) : period;
  return periods.pipe(
    distinctUntilChanged(),
    switchMap((ms) => timer(0, ms)),
  );
}

/**
 * The control signal a {@link fallback} handler returns to retry the source instead of
 * recovering — resubscribe and try again, rather than switch to a recovery value/stream.
 * It's a unique symbol so it can never collide with a real recovered value.
 *
 * @example
 * fallback(request, (_, attempt) => attempt < 3 ? RETRY : "gave up");
 */
export const RETRY: unique symbol = Symbol("RETRY");

/**
 * The value a {@link fallback} handler contributes downstream once `RETRY` is excluded:
 * nothing for a void/undefined return (the error is swallowed and the stream completes),
 * the inner value for an `Observable` return (it's switched to), or the value itself.
 */
type Recovered<R> = Exclude<R, typeof RETRY> extends infer V
  ? V extends void | undefined
    ? never
    : V extends Observable<infer U>
      ? U
      : V
  : never;

/**
 * An error boundary for a stream — the legible, `catch`-block-shaped form of stream error
 * handling (RxJS `catchError` + `retry` in one). If `source` errors, `handler` runs with
 * the error and the attempt number (1 on the first error), and its **return value**
 * decides what happens next, the way the body of a `try/catch` does:
 *
 * - return **`RETRY`** (`(e, attempt) => attempt < 3 ? RETRY : …`) → resubscribe to
 *   `source` and try again (the retry loop — `attempt` increments each time);
 * - return **nothing** (`(e) => console.error(e)`) → the error is swallowed and the
 *   stream completes (RxJS `EMPTY`);
 * - return a **plain value** (`() => "There was an error"`, `() => null`) → that value is
 *   emitted once, then the stream completes (the recovered value);
 * - return an **`Observable`** (`() => of(0)`) → the stream switches to it (full
 *   `catchError` power for an async/multi-value recovery).
 *
 * This is the point of the helper: stream errors don't fit `try/catch` syntax — `try {
 * obs }` reads as "if *evaluating* `obs` throws now," but an observable never throws on
 * reference; it errors *later*, on subscription, when a value flows. `fallback` lets you
 * *think* in `try/catch` terms — retry, recover with a value, or just log — while the
 * handling stays correctly at the stream level. Because it takes the stream as a
 * parameter, the Reactive TS transform leaves the call untouched (operator-style, not a
 * value mapped over emissions). The result is *not* wrapped as a `RenderObservable` —
 * like `interval`, it's a transparent stream guard; render/lift it where you derive a
 * view from it.
 *
 * Note a plain value is emitted via `of`, not `from`, so a string recovers as the whole
 * string (not character-by-character) and an array as the whole array. To stream a
 * promise or array as a *recovery source*, return `from(...)` explicitly.
 *
 * ⚠️ Returning `RETRY` unconditionally retries forever; on a source that always fails
 * *synchronously* that's an infinite loop. Bound it on `attempt` (`(_, n) => n < 3 ? …`)
 * or the error type unless the source can only fail transiently.
 *
 * @example
 * const logged = fallback(risky, (e) => console.error(e));      // swallow + log, completes
 * const labelled = fallback(risky, () => "There was an error");  // RenderObservable<number | string>
 * const orNull = fallback(risky, () => null);                    // number | null — pairs with `?? default`
 * const robust = fallback(risky, (e, n) => n < 3 ? RETRY : 0);   // retry 3×, then recover with 0
 */
export function fallback<T, R>(
  source: Observable<T>,
  handler: (error: unknown, attempt: number) => R | typeof RETRY,
): Observable<T | Recovered<R>> {
  const attempt = (n: number): Observable<unknown> =>
    source.pipe(
      catchError((error) => {
        const recovery = handler(error, n);
        if (recovery === RETRY) return attempt(n + 1);
        if (recovery === undefined) return EMPTY;
        if (isObservable(recovery)) return recovery;
        return of(recovery);
      }),
    );
  return attempt(1) as Observable<T | Recovered<R>>;
}
