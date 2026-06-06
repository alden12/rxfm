// tsrx runtime. The generated code imports `render` from here — a single
// indirection point so the underlying observable implementation (RxJS today,
// possibly a native/RxJS-8 Observable later) can change without touching emitted
// code shape.
import { Observable } from 'rxjs';
import { scan, shareReplay } from 'rxjs/operators';

/**
 * The observable type produced by imperative tsrx syntax — a "RenderObservable".
 *
 * Behaviourally it's a shared, replaying observable: one upstream subscription is
 * shared across subscribers and late subscribers immediately receive the latest
 * value. It exists as a *distinct type* so the imperative/explicit boundary is
 * visible — `RenderObservable<T>` in a hover means "produced by imperative
 * syntax"; `Observable<T>` means "a raw stream written explicitly".
 *
 * It's also the seam for future render-time behaviour (pending/error state,
 * teardown tied to component lifecycle rather than subscriber refcount). Those
 * can be added here without changing emitted code, since the transform always
 * emits `render(...)`.
 */
export class RenderObservable<T> extends Observable<T> {
  constructor(source: Observable<T>) {
    const shared = source.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    super(subscriber => shared.subscribe(subscriber));
  }
}

/**
 * Wrap an observable as a RenderObservable (shared + replaying). Idempotent —
 * passing an existing RenderObservable returns it unchanged.
 */
export function render<T>(source: Observable<T>): RenderObservable<T> {
  return source instanceof RenderObservable ? source : new RenderObservable<T>(source);
}

/**
 * Accumulate a stream's values over time, emitting the running result on every
 * emission — the explicit, legible form of stateful folding (RxJS `scan`).
 *
 * The name is deliberate: scan is *not* terminal (unlike `reduce`/`fold`, which
 * collapse to a single value on completion); it reports its accumulation as each
 * value arrives. `accumulate` keeps the familiar `(accumulator, value) => result`
 * shape of array reduce without implying the stream has to end. Because it takes
 * the stream as a parameter, the tsrx transform leaves the call untouched (it is
 * operator-style, not a value mapped over emissions).
 *
 * @example
 * const highScore = accumulate(score, (highest, score) => Math.max(highest, score), 0);
 */
export function accumulate<T, A>(
  source: Observable<T>,
  accumulator: (acc: A, value: T) => A,
  seed: A,
): RenderObservable<A> {
  return render(source.pipe(scan(accumulator, seed)));
}
