import { BehaviorSubject } from "rxjs";

/**
 * A writable reactive value - Corrente's name for RxJS's `BehaviorSubject`.
 *
 * `State` is where component state lives: `const count = new State(0)`, read the
 * current value synchronously with `count.value`, and push a new one with
 * `count.next(2)` or, when the new value depends on the old, {@link State.update}
 * (`count.update(c => c + 1)`). Used like React's `useState`, except updates hit the
 * DOM immediately (there's no render cycle to wait for).
 *
 * Two reasons it's re-exported under this name rather than leaving people on
 * `BehaviorSubject`:
 *
 * - **Clarity.** "BehaviorSubject" is RxJS FRP jargon; `State` says what it is to a
 *   newcomer and keeps the whole counter example in one vocabulary (one import from
 *   `corrente`, no reach into `rxjs`).
 * - **It requires an initial value, which is the point.** A `State` always has a
 *   current value, so it emits immediately on subscription - a fold (`scan` /
 *   {@link accumulate}) or a derived view built on it shows something on load. A
 *   plain RxJS `Subject` is silent until its first `.next()`, which leaves those
 *   blank until the first event (and nothing in the types warns you). Naming the
 *   common primitive `State` steers you onto the safe shape.
 *
 * It is a `BehaviorSubject` (subclass, no behavioural change), so every RxJS pattern
 * still applies and it interops with any RxJS code. The subclass - rather than a bare
 * `export { BehaviorSubject as State }` alias - exists so the name surfaces in stack
 * traces / devtools / error logs as `State`.
 *
 * Note the writable/derived split: a `State<T>` is the writable source; anything you
 * *derive* from it (`count.map(...)`, a lifted `count * 2`) is a read-only
 * `Observable<T>`. You create State; you derive Observables.
 *
 * @example
 * const count = new State(0);
 * Button.onClick(() => count.update(c => c + 1))`+1`;
 * Div`Clicks: ${count}`; // count stays reactive in the template
 */
export class State<T> extends BehaviorSubject<T> {
  /**
   * Push a new value derived from the current one, without the
   * `next(value + 1)` read-then-write dance.
   *
   * `count.update(c => c + 1)` is exactly `count.next(count.value + 1)`: it reads
   * `this.value`, runs it through `updater`, and emits the result. Handy when the
   * next value is a function of the previous - a counter, a toggle, or an immutable
   * update to an array/object (`list.update(items => [...items, item])`).
   *
   * For a value that doesn't depend on the current one, just use `next`.
   *
   * @example
   * count.update(c => c + 1);                       // counter
   * open.update(o => !o);                           // toggle
   * position.update(([x, y]) => [x + dx, y + dy]);  // immutable update
   */
  update(updater: (current: T) => T): void {
    this.next(updater(this.value));
  }
}

// Pin the class name so it survives library minification (bundlers rename the class
// binding, but this string literal can't be stripped) - `State` then shows up in stack
// traces, devtools, and error logs rather than a mangled name.
Object.defineProperty(State, "name", { value: "State", configurable: true });
