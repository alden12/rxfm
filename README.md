[![Node.js CI](https://github.com/alden12/rxfm/actions/workflows/nodejs.yml/badge.svg?branch=master)](https://github.com/alden12/rxfm/actions/workflows/nodejs.yml)
[![NPM](https://img.shields.io/npm/v/affluente)](https://www.npmjs.com/package/affluente)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/affluente?label=gzipped)](https://bundlephobia.com/result?p=affluente@latest)
[![MIT license](https://img.shields.io/npm/l/affluente)](https://opensource.org/licenses/MIT)

# Affluente

<p align="center">
  <img src="branding/affluente-logo-icon.svg" alt="Affluente" width="100" height="100">
</p>

<p align="center"><em>affluente</em> (Italian): a tributary, a small stream flowing into a bigger one.</p>

**A component is just an `Observable<HTMLElement>`. That's the whole framework.**

A user interface is a pile of values that change over time. Affluente takes that literally: an element
is reactive because it _is_ a stream. There's no virtual DOM, nothing to diff, no re-render cycle - a
single mount at the root (`addToView`) sets the whole app in motion, and state changes hit the DOM
immediately. No `useState`, no dependency arrays, no memoization, and none of the bugs that come with a
render cycle, because there isn't one.

The catch with reactive streams has always been that they're intimidating to write. So the optional
**Reactive TS** layer lets you write the plain expression and lifts it into the exact reactive stream
for you, fully typed. Here's the whole idea in one line - take the cursor's position and derive a
colour from it with ordinary maths:

```ts
const hue = (mouseMovementX / 4) % 360; // plain maths, but hue is live
```

Push the mouse position into `mouseMovementX`, drop `hue` into a style, and the gradient tracks your cursor:

```ts demo=reactive-gradient
import { Div, State } from "affluente";

export const ReactiveGradient = () => {
  const mouseMovementX = new State(0);
  const hue = mouseMovementX % 360; // a number stream, derived with ordinary maths

  return Div.onMousemove((e) => mouseMovementX.next(e.offsetX)).style({
    background: `linear-gradient(135deg, hsl(${hue} 85% 55%), hsl(${hue + 60} 85% 60%))`,
  })`Move your mouse`;
};
```

Move your mouse across it: no CSS animation could follow the cursor like this. `hue` is live because
`mouseMovementX` is, so the moment it lands in the style string the element is bound to it and repaints as you
move. There's no render cycle scheduling it, because there isn't one anywhere in Affluente.

The same trick works over time. `frames()`, `timer(due, period)`, and `interval(period)` are reactive
clocks - derive a value from one and it updates on its own, with no loop to write. Pass a stream for the
rate to change it on the fly, or `null` to stop.

State works the same way. Here a click count drives a derived value, written as a plain expression that
stays reactive:

```ts demo=counter
import { Button, State, addToView } from "affluente";

const ClickCounter = () => {
  const clicks = new State(0);
  const doubled = clicks * 2; // count * 2 stays reactive, no map and no pipe

  return Button.onClick(() =>
    clicks.update((c) => c + 1),
  )`Clicks: ${clicks} (doubled: ${doubled})`;
};

addToView(ClickCounter()); // the one subscription your app needs - mounts to document.body
```

That `clicks * 2` is the whole pitch. Reactive TS lifts it to the exact RxJS that runs underneath:

```ts
const doubled = clicks * 2; // with Reactive TS
const doubled = clicks.pipe(map((c) => c * 2)); // the RxJS it runs as
```

No new runtime model, nothing hidden, just less ceremony.

Components are functions for a reason: a component's `State` is declared _inside_ it, so each call -
`ClickCounter()` - is an independent instance with its own state. Write components as functions and
instantiate them where you mount them; a single built component value (state declared at module scope,
or `ClickCounter()` called once and reused) shares that state across every place it appears.

## Fluent operators, straight from the proposal

`State` (used above) is a writable value: read it with `.value`, set it with `.next(...)`, or
`.update((c) => c + 1)` when the next value comes from the current one. (Under the hood it's an RxJS
`BehaviorSubject`.) Every stream also carries fluent operator methods, modelled on the
[WICG Observable proposal](https://github.com/WICG/observable), so chaining reads the way the platform
itself is heading:

```ts
import { State } from "affluente";

const query = new State("");
const settled = query.debounce(200); // wait for a 200ms pause, then emit the latest value
```

The set follows the proposal (`map`, `filter`, `take`, `drop`, `takeUntil`, `catch`, `finally`,
`flatMap`), plus `scan` (a running fold) and `debounce` / `throttle`. They're real methods on the
stream, so the same code is one polyfill away from running on a native `Observable` if the proposal
ships, and in a `.rts` file they're offered in autocomplete and lift as genuine stream operators.

## Why Affluente

- **Streams _are_ the components.** No virtual DOM, no reconciliation, no render scheduling - state
  changes hit the DOM immediately.
- **It's just RxJS.** Everything composes with the operators and patterns you already know; `rxjs` is
  the only dependency.
- **Tiny and transparent.** A small operator library over `Observable` - easy to read, easy to reason
  about what the framework is doing.
- **Plain expressions, fully typed (Reactive TS).** Write `count * 2`, `a === b`, `cond ? x : y`; your editor
  shows real inferred types live, with no `any` and no false errors.

## Quick start

```sh
npm install affluente rxjs@^7
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
| 📖 [Guide](docs/guide.md)                                 | The full walkthrough - components, state, attributes, lists. |
| 🧩 [Examples](site/)                                      | The Reactive TS example suite that powers the live demo.     |
| 📘 [Plain-TypeScript reference](docs/plain-typescript.md) | Affluente in plain RxJS, no build step.                       |
| 🧪 [Reactive TS roadmap](reactive-ts/ROADMAP.md)          | Status of the experimental Reactive TS layer.                |

> ⚠️ **Alpha.** This is the `3.0.0-alpha` line - an in-progress redesign (Vite build, no JSX, a new
> fluent component API). The API may change between alpha versions. For the current **stable
> release** and its **JSX/TSX syntax**, see the
> [v2.1.1 README](https://github.com/alden12/rxfm/blob/v2.1.1/README.md).
>
> 🧪 **Reactive TS is experimental.** The transform, Vite plugin, and editor extension are a spike that
> currently lives in this repo (not yet on npm) - see the [roadmap](reactive-ts/ROADMAP.md). Plain Affluente
> needs none of it.

I'd love to hear whether this style holds any interest for you - feedback and ideas are very welcome.
These docs will eventually move to the project site (github.io), which currently hosts the demo.

---

Built on [RxJS](https://github.com/ReactiveX/rxjs). MIT licensed. Authored by Alden Laslett.
