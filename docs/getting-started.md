# Getting started

RxFM works in two styles. Pick the one that suits you — they interoperate, so you can mix them in
one app.

- **Plain RxFM** — ordinary RxJS, no build step. `npm install` and go. Best for trying RxFM out or
  shipping today.
- **Reactive TS** *(experimental)* — write derived values as plain expressions (`count * 2`) and have them
  lifted into reactive streams, with live editor types. Needs a small build + editor setup.

---

## Track A — plain RxFM (no build step)

Install RxFM and its `rxjs` peer dependency:

```sh
npm install rxfm rxjs@^7
# or: yarn add rxfm rxjs@^7
```

Write a component (a component is just an `Observable<HTMLElement>`) and mount it once at the root
with `addToView`:

```ts
import { Div, addToView } from 'rxfm';

const HelloWorld = Div('Hello, World!');

addToView(HelloWorld); // mounts to document.body; returns a teardown function
```

`addToView` is the one subscription your app needs. Under the hood it's the line you'd otherwise
write by hand — `HelloWorld.subscribe(el => document.body.appendChild(el))` — except it also swaps
the element if the component ever re-emits (e.g. a conditional or switched root, which a plain
`appendChild` would duplicate) and hands you a function to tear it down. That's the whole trick;
there's no virtual DOM underneath.

That's it — no bundler plugin, no transform. The full walkthrough lives in the
[plain-TypeScript reference](plain-typescript.md), and the
[rxfm-starter](https://github.com/alden12/rxfm-starter) repo is a ready-to-run scaffold.

---

## Track B — Reactive TS (experimental)

Reactive TS lets you write reactive derivations as if streams were ordinary values:

```ts
const doubled = count * 2;             // a stream that re-emits whenever count changes
const isActive = selected === option;  // a boolean stream
const view = visible ? Div`Hi` : null; // swaps the component reactively
```

See the [Reactive TS guide](guide.md) for the full style, and [How Reactive TS works](guide.md#how-reactive-ts-works) for
the mechanics. Two pieces give you the experience: **live editor types** and a **build transform**.

> ⚠️ **Status.** The Reactive TS tooling (the transform, the Vite plugin, the runtime, and the editor
> extension) is a spike and is **not yet published to npm or the VS Code Marketplace**. Today it
> lives in this repository — the most reliable way to use it is to run it from a clone of this repo
> (the demo under [examples/](../examples/) is wired up and ready). Packaging it for external
> projects is on the [roadmap](../reactive-ts/ROADMAP.md).

### 1. Live editor types (VS Code extension)

`.rts` files would normally be rejected by `tsc` (you can't write `count * 2` over an `Observable`).
The extension contributes a tsserver plugin that transforms each file on every keystroke, type-checks
the real RxJS, and maps the results back — so hovers, errors, and go-to-definition all work on your
imperative source.

A pre-built `.vsix` is committed in the repo, so you can install it without the Extension Development
Host:

```sh
code --install-extension reactive-ts/vscode-extension/reactive-ts-vscode-0.0.20.vsix
```

…or in the Extensions view → **⋯** → **Install from VSIX…**. Then open any `.rts` file and hover a
binding. See the extension's own [README](../reactive-ts/vscode-extension/README.md) for details and how to
rebuild it.

For the editor to resolve real types, `.rts` files need a tsconfig pinning the transform's compiler
options plus your `rxfm` path — see [examples/tsconfig.json](../examples/tsconfig.json) (mirrored from
[reactive-ts/tsconfig.json](../reactive-ts/tsconfig.json)) for the reference. The root `tsconfig.json` should
**exclude** the `.rts` directory so it doesn't get type-checked as plain TS with default options.

### 2. The build (Vite)

The same transform runs at build time via the Vite plugin, so what you ship matches what you saw
typed. The wiring (see [vite.config.ts](../vite.config.ts) in this repo) is:

```ts
import { defineConfig } from 'vite';
import { reactiveTs } from './reactive-ts/vite-plugin-reactive-ts';

export default defineConfig({
  plugins: [reactiveTs()],
  resolve: {
    // resolve bare cross-file imports (`from './game'`, `from './runtime'`) to .rts / .ts
    extensions: ['.rts', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
});
```

The helpers Reactive TS leaves for you to call by hand — `accumulate`, `interval`, and `EMPTY` — are
exported from the package root, so you import them like anything else:

```ts
import { accumulate, interval, EMPTY } from 'rxfm';
```

The transform also emits `import { render } from "./…/runtime"` around lifted expressions, so it
needs a `runtime.ts` reachable by walking up from your `.rts` files; make it a one-line re-export
of the rxfm runtime:

```ts
// runtime.ts
export * from 'rxfm';
```

(In this repo the examples re-export from the library source via [examples/runtime.ts](../examples/runtime.ts)
rather than the published package — the same reason the demo aliases `rxfm` to `src/` — but a real
consumer's `runtime.ts` is just the one-liner above.)

### Run the examples

From a clone of this repo:

```sh
yarn          # install
yarn dev      # Reactive TS demo on http://localhost:3000
```

The demo entry is [examples/main.ts](../examples/main.ts); every example it renders is authored in
Reactive TS under [examples/](../examples/). `yarn build:app` produces the static demo in `dist-demo/`.
