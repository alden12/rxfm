# RxFM

[![Node.js CI](https://github.com/alden12/rxfm/actions/workflows/nodejs.yml/badge.svg?branch=master)](https://github.com/alden12/rxfm/actions/workflows/nodejs.yml)
[![NPM](https://img.shields.io/npm/v/rxfm)](https://www.npmjs.com/package/rxfm)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/rxfm?label=gzipped)](https://bundlephobia.com/result?p=rxfm@latest)
[![MIT license](https://img.shields.io/npm/l/rxfm)](https://opensource.org/licenses/MIT)

**Build reactive web apps as plain RxJS streams — no virtual DOM, no re-render cycle.**

In RxFM a **component is just an `Observable<HTMLElement>`**. Elements are reactive simply because
they're streams, so there's nothing to diff and nothing to re-render — a single mount at the app
root (`addToView`) sets the whole app in motion. With the experimental **Reactive TS** layer, derived state reads like
ordinary maths (`count * 2`) and is lifted into reactive streams for you, fully typed.

```ts demo=counter
import { Div, Button, addToView } from 'rxfm';
import { BehaviorSubject } from 'rxjs';

const Counter = () => {
  const count = new BehaviorSubject(0);

  return Div(
    Button.onClick(() => count.next(count.value + 1))`+1`,
    Div`${count} clicks · doubled ${count * 2}`,   // count * 2 stays reactive — no map, no pipe
  );
};

addToView(Counter()); // the one subscription your app needs — mounts to document.body
```

That `count * 2` is the whole pitch. Reactive TS lifts it to the exact RxJS you'd otherwise write by hand:

```ts
const doubled = count * 2;                  // with Reactive TS
const doubled = count.pipe(map(c => c * 2)); // the plain-RxJS equivalent it compiles to
```

No new runtime model, nothing hidden — just less ceremony.

## Why RxFM

- **Streams *are* the components.** No virtual DOM, no reconciliation, no render scheduling — state
  changes hit the DOM immediately.
- **It's just RxJS.** Everything composes with the operators and patterns you already know; `rxjs` is
  the only dependency.
- **Tiny and transparent.** A small operator library over `Observable` — easy to read, easy to reason
  about what the framework is doing.
- **Plain expressions, fully typed (Reactive TS).** Write `count * 2`, `a === b`, `cond ? x : y`; your editor
  shows real inferred types live, with no `any` and no false errors.

## Quick start

```sh
npm install rxfm rxjs@^7
```

…then see **[Getting started](docs/getting-started.md)**. To run the example app locally:

```sh
git clone https://github.com/alden12/rxfm && cd rxfm
yarn && yarn dev      # http://localhost:3000
```

Or browse the [**live demo**](https://alden12.github.io/rxfm/).

## Documentation

| | |
| --- | --- |
| 🚀 [Getting started](docs/getting-started.md) | Install, editor setup, and the Reactive TS build. |
| 📖 [Guide](docs/guide.md) | The full walkthrough — components, state, attributes, lists. |
| 🧩 [Examples](site/) | The Reactive TS example suite that powers the live demo. |
| 📘 [Plain-TypeScript reference](docs/plain-typescript.md) | RxFM in plain RxJS, no build step. |
| 🧪 [Reactive TS roadmap](reactive-ts/ROADMAP.md) | Status of the experimental Reactive TS layer. |

> ⚠️ **Alpha.** This is the `3.0.0-alpha` line — an in-progress redesign (Vite build, no JSX, a new
> fluent component API). The API may change between alpha versions. For the current **stable
> release** and its **JSX/TSX syntax**, see the
> [v2.1.1 README](https://github.com/alden12/rxfm/blob/v2.1.1/README.md).
>
> 🧪 **Reactive TS is experimental.** The transform, Vite plugin, and editor extension are a spike that
> currently lives in this repo (not yet on npm) — see the [roadmap](reactive-ts/ROADMAP.md). Plain RxFM
> needs none of it.

I'd love to hear whether this style holds any interest for you — feedback and ideas are very welcome.
These docs will eventually move to the project site (github.io), which currently hosts the demo.

---

Built on [RxJS](https://github.com/ReactiveX/rxjs). MIT licensed. Authored by Alden Laslett.
