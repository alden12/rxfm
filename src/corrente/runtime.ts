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
import {
  EMPTY,
  Observable,
  animationFrames,
  combineLatest,
  isObservable,
  of,
  timer as rxTimer,
} from "rxjs";
import {
  catchError,
  distinctUntilChanged,
  map,
  scan,
  shareReplay,
  startWith,
  switchMap,
  takeWhile,
  tap,
  withLatestFrom,
} from "rxjs/operators";
import { coerceToObservable } from "./utils/utils";

// Re-exported so the filter idiom `cond ? value : EMPTY` needs only one Reactive TS import:
// a ternary whose else-branch is EMPTY drops the value when the condition is false
// (the imperative spelling of RxJS `filter`).
export { EMPTY };

// Re-exported on the runtime surface because the transform emits it: lifting a lookup
// table whose values are `TypeOrObservable<T>` (mix of plain values and streams) over an
// observable key flattens with `switchMap(k => coerceToObservable(MAP[k]))`. Sourced from
// the runtime (not `corrente` directly) so generated code depends only on the runtime seam —
// keeping the option open to split Reactive TS out from corrente later. (Imported above
// rather than re-exported in place, since `interval` now uses it locally too.)
export { coerceToObservable };

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
 * @deprecated Use the new `scan` method on observables instead.
 */
export function accumulate<T, A>(
  source: Observable<T>,
  accumulator: (acc: A, value: T) => A,
  seed: A,
): RenderObservable<A | null> {
  return render(source.pipe(scan(accumulator, seed), startWith(null)));
}

/**
 * A clock: emits `0, 1, 2, …` every `period` ms, with the first tick arriving after
 * the first `period` (RxJS `interval` semantics, not an immediate one). For a clock
 * that fires now and then repeats, use {@link timer} with a `0` initial delay
 * (`timer(0, period)`).
 *
 * The point is the reactive overload: pass an `Observable<number>` and the clock
 * restarts at the new rate whenever the period changes, so a difficulty-driven game
 * speed Just Works. That restart-on-change is a stream-of-streams switch (build a
 * fresh timer per period, switch to it), the one shape lifting fundamentally can't
 * express, so it lives here as a named helper rather than an inline
 * `switchMap(p => timer(p, p))`. Passing `null` (or a stream that emits `null`) turns
 * the clock off (`EMPTY`), so the filter idiom `running ? rate : null` gates it.
 *
 * @example
 * const period = periodFor(difficulty);          // RenderObservable<number>
 * const tick = interval(period);                 // restarts when difficulty changes
 * const ticking = interval(running ? 100 : null); // stops when `running` is false
 */
export function interval(
  period: number | null | Observable<number | null>,
): RenderObservable<number> {
  return render(
    coerceToObservable(period).pipe(
      distinctUntilChanged(),
      switchMap((ms) => (ms === null ? EMPTY : rxTimer(ms, ms))),
    ),
  );
}

/**
 * RxJS `timer`, with liftable inputs: fires its first tick after `due` ms, then (when
 * a `period` is given) every `period` ms, emitting `0, 1, 2, …`. Either argument may
 * be a plain `number` or an `Observable<number | null>`; when one is a stream the
 * clock rebuilds at the new timing whenever it changes (the stream-of-streams switch
 * lifting can't express). Omit `period` for a one-shot timer that fires once and
 * completes, exactly like RxJS.
 *
 * Whenever `due` or `period` resolves to `null`, the clock turns off (`EMPTY`); push a
 * number again to restart it. So `timer(0, running ? 100 : null)` is an
 * immediate-start clock you toggle by flipping the period, the companion to
 * {@link interval}'s delayed-start gate. The common case is `due = 0` set once and
 * forgotten, with the period carrying the reactive rate.
 *
 * @example
 * timer(1000);                     // fire once after 1s, then complete
 * timer(0, 100);                   // immediate, then every 100ms
 * timer(0, running ? 100 : null);  // immediate clock, off when not running
 * timer(0, periodFor(difficulty)); // immediate clock that changes speed
 */
export function timer(
  due: number | null | Observable<number | null>,
  period?: number | null | Observable<number | null>,
): RenderObservable<number> {
  const due$ = coerceToObservable(due);
  // No `period` argument at all: a one-shot timer (fire once after `due`, complete),
  // matching RxJS `timer(due)`. A `null` *value* (below) means "off", which is a
  // distinct case from "no repeat".
  if (period === undefined) {
    return render(
      due$.pipe(
        distinctUntilChanged(),
        switchMap((ms) => (ms === null ? EMPTY : rxTimer(ms))),
      ),
    );
  }
  return render(
    combineLatest([due$, coerceToObservable(period)]).pipe(
      distinctUntilChanged((a, b) => a[0] === b[0] && a[1] === b[1]),
      switchMap(([d, p]) => (d === null || p === null ? EMPTY : rxTimer(d, p))),
    ),
  );
}

/** Linear (no-op) easing - the default for {@link animate}. */
const linear = (t: number) => t;

/**
 * A frame clock: emits the **elapsed milliseconds since subscription**, once per browser
 * animation frame, and keeps going until you stop listening. It's the `requestAnimationFrame`
 * sibling of {@link interval}/{@link timer} - a clock, but paced to the display (60Hz, 120Hz,
 * whatever the screen runs at) and stamped with real elapsed time rather than a fixed period.
 *
 * This is the open-ended workhorse: drive a continuous, never-ending animation by mapping
 * elapsed time to a value (`frames().map(ms => (ms * 0.06) % 360)` spins 60deg/sec forever).
 * The browser pauses frames in background tabs, so an off-screen animation costs nothing, and
 * because it's an ordinary stream it stops - cancelling the underlying `requestAnimationFrame` -
 * when its subscriber goes away (i.e. when the component leaves the view), with no manual
 * teardown. {@link animate} is this clock plus an easing curve and a stop time.
 *
 * @example
 * const angle = frames().map((ms) => (ms * 0.06) % 360);  // continuous 60deg/sec spin
 */
export function frames(): RenderObservable<number> {
  return render(animationFrames().pipe(map(({ elapsed }) => elapsed)));
}

/** Options for {@link animate}: how long the tween runs, its easing, and an optional fixed start. */
export interface AnimateOptions {
  /**
   * Tween length in milliseconds. May be a stream (e.g. a `State`), in which case its latest
   * value is sampled at the start of each tween - so a moving `target` can ease over a different
   * duration each time (a longer jump taking longer, say). Changing it alone doesn't disturb a
   * tween already in flight; the new value applies to the next target.
   */
  duration: number | Observable<number>;
  /** Maps linear progress `0..1` to eased progress `0..1`. Defaults to linear. */
  easing?: (t: number) => number;
  /**
   * The value to ease *from*. Omit it (the usual case) and the tween starts from wherever the
   * value currently is - so a moving `target` retargets smoothly from its current position.
   * Pin it for a one-shot tween with a known start (`animate(360, { from: 0, duration: 1000 })`).
   */
  from?: number;
}

/**
 * A value that eases toward a **target** over a duration - the finite tween, and the shape you
 * usually want for a value bound into the view. Give it a target (a number, or a stream of
 * targets like a `State`) and it animates from its current position to the latest target,
 * easing as it goes; set a new target mid-flight and it smoothly retargets. "The wheel eases
 * toward `target`; clicking moves the target" - the way `useSpring`/`animate` read in React
 * animation libraries: no clocks, no stop condition, no teardown to think about.
 *
 * Built on {@link frames}: a tween is just the frame clock mapped through `easing` between two
 * endpoints, stopped once `duration` elapses (the final frame emits the exact target, then the
 * stream completes - so it tears down with the graph, leak-free). It also hides the one piece
 * imperative syntax can't express: switching to a fresh tween on each target change is a
 * stream-of-streams switch, the same reason {@link interval}/{@link timer} are helpers.
 *
 * @example
 * const target = new State(0);
 * const angle = animate(target, { duration: 4000, easing: easeOutCubic }); // chases target
 * const nudge = () => target.update((a) => a + 360);                       // each call eases a turn
 * animate(360, { from: 0, duration: 1000 });                              // one-shot 0 -> 360
 */
export function animate(
  target: number | Observable<number>,
  { duration, easing = linear, from }: AnimateOptions,
): RenderObservable<number> {
  // The position we ease the next target FROM. Seeded by `from` when pinned, otherwise tracked
  // from the last emitted value so a moving target continues from where it currently is. A
  // closure (one per call, i.e. one per component instance), updated as the tween emits - an
  // internal detail the caller never sees.
  let current = from;
  return render(
    coerceToObservable(target).pipe(
      distinctUntilChanged(),
      // Sample the latest duration at each target change (`withLatestFrom`, not `combineLatest`):
      // a duration change alone shouldn't restart an in-flight tween, only re-time the next one.
      withLatestFrom(coerceToObservable(duration)),
      switchMap(([to, durationMs]) => {
        const start = current;
        const tween =
          start === undefined
            ? of(to) // nothing to ease from yet: show the first target immediately
            : frames().pipe(
                map((elapsed) => Math.min(elapsed / durationMs, 1)),
                // Inclusive: emit the final `t === 1` (the exact target), then complete.
                takeWhile((t) => t < 1, true),
                map((t) => start + (to - start) * easing(t)),
              );
        return tween.pipe(tap((value) => (current = value)));
      }),
    ),
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
type Recovered<R> =
  Exclude<R, typeof RETRY> extends infer V
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
