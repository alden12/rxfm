# @reactive-ts/core

Write **Reactive TS** (`.rts`) — imperative-looking observable code — and compile it to real,
fully-typed [RxJS](https://rxjs.dev). This package ships the transform that does the lifting, plus a
Vite plugin that runs it in your build.

```ts
// counter.rts — plain expressions, but `doubled` stays reactive
const clicks = new State(0);
const doubled = clicks * 2; // no map, no pipe

// …compiles to real RxJS: clicks.pipe(map(clicks => clicks * 2))
```

Reactive TS is the language layer behind [Corrente](https://www.npmjs.com/package/corrente); the
transform is framework-agnostic and emits ordinary RxJS.

> **Status: experimental (0.x).** The API and emitted output may change between minor versions.

## Install

```bash
npm install -D @reactive-ts/core
```

`typescript` is a peer dependency (the transform borrows your TypeScript's checker). `vite` is an
optional peer, needed only for the `/vite` entry.

## Vite plugin

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { reactiveTs } from "@reactive-ts/core/vite";

export default defineConfig({
  plugins: [reactiveTs()],
  // let bare imports resolve `./foo` → `./foo.rts`
  resolve: { extensions: [".rts", ".ts", ".js"] },
});
```

`.rts` modules are compiled to JS; `?raw` / `?url` / `?inline` imports are left to Vite core, so you
can still import a `.rts` file's own source as text.

## Transform API

```ts
import ts from "typescript";
import { transformWithMappings } from "@reactive-ts/core";

const { code } = transformWithMappings(ts, source, baseDir);
// `code` is generated TypeScript (real RxJS); `baseDir` anchors the source's imports.
```

`transformWithMappings` also returns source↔generated position mappings and diagnostics used by the
editor language service — see the type declarations for the full shape.

## Editor types

Live `.rts` types in the editor come from the separate **Reactive TS** VS Code extension (the tsserver
plugin), not this package. This package is the build-time transform.

## License

MIT © Alden Laslett
