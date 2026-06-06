# Getting started

RxFM works in two styles. Pick the one that suits you — they interoperate, so you can mix them in
one app.

- **Plain RxFM** — ordinary RxJS, no build step. `npm install` and go. Best for trying RxFM out or
  shipping today.
- **tsrx** *(experimental)* — write derived values as plain expressions (`count * 2`) and have them
  lifted into reactive streams, with live editor types. Needs a small build + editor setup.

---

## Track A — plain RxFM (no build step)

Install RxFM and its `rxjs` peer dependency:

```sh
npm install rxfm rxjs@^7
# or: yarn add rxfm rxjs@^7
```

Write a component (a component is just an `Observable<HTMLElement>`) and subscribe once at the root:

```ts
import { Div } from 'rxfm';

const HelloWorld = Div('Hello, World!');

HelloWorld.subscribe(el => document.body.appendChild(el));
```

That's it — no bundler plugin, no transform. The full walkthrough lives in the
[plain-TypeScript reference](plain-typescript.md), and the
[rxfm-starter](https://github.com/alden12/rxfm-starter) repo is a ready-to-run scaffold.

---

## Track B — tsrx (experimental)

tsrx lets you write reactive derivations as if streams were ordinary values:

```ts
const doubled = count * 2;             // a stream that re-emits whenever count changes
const isActive = selected === option;  // a boolean stream
const view = visible ? Div`Hi` : null; // swaps the component reactively
```

See the [tsrx guide](guide.md) for the full style, and [How tsrx works](guide.md#how-tsrx-works) for
the mechanics. Two pieces give you the experience: **live editor types** and a **build transform**.

> ⚠️ **Status.** The tsrx tooling (the transform, the Vite plugin, the runtime, and the editor
> extension) is a spike and is **not yet published to npm or the VS Code Marketplace**. Today it
> lives in this repository — the most reliable way to use it is to run it from a clone of this repo
> (the demo under [examples/](../examples/) is wired up and ready). Packaging it for external
> projects is on the [roadmap](../tsrx/ROADMAP.md).

### 1. Live editor types (VS Code extension)

`.tsrx` files would normally be rejected by `tsc` (you can't write `count * 2` over an `Observable`).
The extension contributes a tsserver plugin that transforms each file on every keystroke, type-checks
the real RxJS, and maps the results back — so hovers, errors, and go-to-definition all work on your
imperative source.

A pre-built `.vsix` is committed in the repo, so you can install it without the Extension Development
Host:

```sh
code --install-extension tsrx/vscode-extension/tsrx-vscode-0.0.13.vsix
```

…or in the Extensions view → **⋯** → **Install from VSIX…**. Then open any `.tsrx` file and hover a
binding. See the extension's own [README](../tsrx/vscode-extension/README.md) for details and how to
rebuild it.

For the editor to resolve real types, `.tsrx` files need a tsconfig pinning the transform's compiler
options plus your `rxfm` path — see [examples/tsconfig.json](../examples/tsconfig.json) (mirrored from
[tsrx/tsconfig.json](../tsrx/tsconfig.json)) for the reference. The root `tsconfig.json` should
**exclude** the `.tsrx` directory so it doesn't get type-checked as plain TS with default options.

### 2. The build (Vite)

The same transform runs at build time via the Vite plugin, so what you ship matches what you saw
typed. The wiring (see [vite.config.ts](../vite.config.ts) in this repo) is:

```ts
import { defineConfig } from 'vite';
import { tsrx } from './tsrx/vite-plugin-tsrx.mjs';

export default defineConfig({
  plugins: [tsrx()],
  resolve: {
    // resolve bare cross-file imports (`from './game'`, `from './runtime'`) to .tsrx / .ts
    extensions: ['.tsrx', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
});
```

The transform emits `import { render } from "./…/runtime"`; provide a `runtime.ts` reachable by
walking up from your `.tsrx` files. In this repo the canonical implementation is
[tsrx/runtime.ts](../tsrx/runtime.ts), re-exported next to the examples as
[examples/runtime.ts](../examples/runtime.ts) so the demo tree (a sibling of `tsrx/`) can reach it.
The runtime also exports the helpers tsrx leaves for you to call by hand — `accumulate`, `interval`,
`EMPTY`.

### Run the examples

From a clone of this repo:

```sh
yarn          # install
yarn dev      # tsrx demo on http://localhost:3000
```

The demo entry is [examples/main.ts](../examples/main.ts); every example it renders is authored in
tsrx under [examples/](../examples/). `yarn build:app` produces the static demo in `dist-demo/`.
