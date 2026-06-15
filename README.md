[![Node.js CI](https://github.com/alden12/rxfm/actions/workflows/nodejs.yml/badge.svg?branch=master)](https://github.com/alden12/rxfm/actions/workflows/nodejs.yml)
[![NPM](https://img.shields.io/npm/v/rxfm)](https://www.npmjs.com/package/rxfm)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/rxfm?label=gzipped)](https://bundlephobia.com/result?p=rxfm@latest)
[![MIT license](https://img.shields.io/npm/l/rxfm)](https://opensource.org/licenses/MIT)

# Corrente

<p align="center">
  <img src="branding/corrente-logo-icon.svg" alt="Corrente" width="100" height="100">
</p>

**A component is just an `Observable<HTMLElement>`. That's the whole framework.**

A user interface is a pile of values that change over time. Corrente takes that literally: an element
is reactive because it _is_ a stream. There's no virtual DOM, nothing to diff, no re-render cycle - a
single mount at the root (`addToView`) sets the whole app in motion, and state changes hit the DOM
immediately. No `useState`, no dependency arrays, no memoization, and none of the bugs that come with
a render cycle, because there isn't one.

The catch with reactive streams has always been that they're intimidating to write. So the optional
**Reactive TS** layer lets you write the plain expression - `count * 2` - and lifts it into the exact
reactive stream for you, fully typed.

```ts demo=counter
import { Div, Button, addToView, State } from "corrente";

const Counter = () => {
  const count = new State(0);

  return Div(
    Button.onClick(() => count.update((c) => c + 1))`+1`,
    Div`${count} clicks · doubled ${count * 2}`, // count * 2 stays reactive — no map, no pipe
  );
};

addToView(Counter()); // the one subscription your app needs — mounts to document.body
```

That `count * 2` is the whole pitch. Reactive TS lifts it to the exact RxJS you'd otherwise write by hand:

```ts
const doubled = count * 2; // with Reactive TS
const doubled = count.pipe(map((c) => c * 2)); // the plain-RxJS equivalent it compiles to
```

No new runtime model, nothing hidden — just less ceremony.

Components are functions for a reason: a component's `State` is declared _inside_ it, so each call -
`Counter()` - is an independent instance with its own state. Write components as functions and
instantiate them where you mount them; a single built component value (state declared at module scope,
or `Counter()` called once and reused) shares that state across every place it appears.

It works over time, too. Here a clock drives a hue with ordinary maths, dropped straight into a
style, so the gradient animates forever with no animation loop, no `requestAnimationFrame`, and no
state:

```ts demo=breathing-gradient
import { Div, timer } from "corrente";

const tick = timer(0, 50); // a clock, ticking every 50ms
const hue = (tick * 2) % 360; // a number stream, derived with ordinary maths

export const BreathingGradient = Div.style({
  background: `linear-gradient(135deg, hsl(${hue} 85% 55%), hsl(${hue + 60} 85% 60%))`,
})`Reactive by default`;
```

`hue` is a stream because `tick` is; the moment it lands in the style string the element is bound to
it and repaints on every tick. There's no render cycle to schedule the animation, because there isn't
one anywhere in Corrente.

The clock is Corrente's own: `timer(0, 50)` ticks immediately and then every 50ms, while `interval(50)`
waits one period before its first tick - the reactive-input forms of their RxJS namesakes. Pass a
stream for the period and the rate changes on the fly; pass `null` to stop the clock.

## Fluent operators, straight from the proposal

`State` (used above) is Corrente's name for an RxJS `BehaviorSubject`: a writable value you read with
`.value` and update with `.next(...)` (or `.update((c) => c + 1)` when the next value is derived from
the current one, as above). Every stream also carries the fluent operator methods from the
[WICG Observable proposal](https://github.com/WICG/observable), so chaining reads the way the platform
itself is heading:

```ts
import { State } from "corrente";

const query = new State("");
const settled = query.debounce(200); // wait for a 200ms pause, then emit the latest value
```

The set mirrors the proposal (`map`, `filter`, `take`, `drop`, `takeUntil`, `catch`, `finally`,
`flatMap`), plus `scan` (a running fold) and `debounce` / `throttle`. The proposal's terminal,
Promise-returning operators (`reduce`, `toArray`, …) are intentionally left out, since Corrente streams
never complete and the Promise would never resolve. They're real methods on `Observable`, so the same
code is one polyfill away from running on the platform's native `Observable` if it ships, and in a
`.rts` file they're offered in autocomplete and lift as genuine stream operators.

## Why Corrente

- **Streams _are_ the components.** No virtual DOM, no reconciliation, no render scheduling — state
  changes hit the DOM immediately.
- **It's just RxJS.** Everything composes with the operators and patterns you already know; `rxjs` is
  the only dependency.
- **Tiny and transparent.** A small operator library over `Observable` — easy to read, easy to reason
  about what the framework is doing.
- **Plain expressions, fully typed (Reactive TS).** Write `count * 2`, `a === b`, `cond ? x : y`; your editor
  shows real inferred types live, with no `any` and no false errors.

## Quick start

```sh
npm install corrente rxjs@^7
```

…then see **[Getting started](docs/getting-started.md)**. To run the example app locally:

```sh
git clone https://github.com/alden12/rxfm && cd rxfm
yarn && yarn dev      # http://localhost:3000
```

Or browse the [**live demo**](https://alden12.github.io/rxfm/).

## Documentation

|                                                           |                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| 🚀 [Getting started](docs/getting-started.md)             | Install, editor setup, and the Reactive TS build.            |
| 📖 [Guide](docs/guide.md)                                 | The full walkthrough — components, state, attributes, lists. |
| 🧩 [Examples](site/)                                      | The Reactive TS example suite that powers the live demo.     |
| 📘 [Plain-TypeScript reference](docs/plain-typescript.md) | Corrente in plain RxJS, no build step.                       |
| 🧪 [Reactive TS roadmap](reactive-ts/ROADMAP.md)          | Status of the experimental Reactive TS layer.                |

> ⚠️ **Alpha.** This is the `3.0.0-alpha` line — an in-progress redesign (Vite build, no JSX, a new
> fluent component API). The API may change between alpha versions. For the current **stable
> release** and its **JSX/TSX syntax**, see the
> [v2.1.1 README](https://github.com/alden12/rxfm/blob/v2.1.1/README.md).
>
> 🧪 **Reactive TS is experimental.** The transform, Vite plugin, and editor extension are a spike that
> currently lives in this repo (not yet on npm) — see the [roadmap](reactive-ts/ROADMAP.md). Plain Corrente
> needs none of it.

I'd love to hear whether this style holds any interest for you — feedback and ideas are very welcome.
These docs will eventually move to the project site (github.io), which currently hosts the demo.

---

Built on [RxJS](https://github.com/ReactiveX/rxjs). MIT licensed. Authored by Alden Laslett.
