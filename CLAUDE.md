# RxFM

An experimental web framework built on RxJS. The core idea: **a component is just an `Observable<HTMLElement | SVGElement>`**. There is no virtual DOM and no re-render cycle — elements are reactive simply because they're observable streams. A single `subscribe` at the app root sets the whole app in motion; everything else piggybacks on that subscription.

- Published to npm as `rxfm` (v3.x). `rxjs ^7.0.0` is a peer dependency.
- Authored by Alden Laslett (this repo's owner). MIT licensed.
- Live demo: https://alden12.github.io/rxfm/ · Starter app: https://github.com/alden12/rxfm-starter
- **No JSX.** As of v3.0.0 the JSX factory was removed; components are written with the plain
  function API (`Div`, `Span`, `Button`, … + tagged templates + operators). JSX may return in a
  redesigned form later. (The pre-v3 JSX layer lived in a `src/lib/rxfm/rxfm-jsx/` directory.)

## Layout

- [src/lib/rxfm/](src/lib/rxfm/) — the framework itself (what gets published). `src/` now holds only `lib/`.
- [src/lib/index.ts](src/lib/index.ts) — package entry, re-exports `src/lib/rxfm` (named exports only, no default).
- [examples/](examples/) — example/demo app (NOT published; see `files: ["dist"]` in package.json). As of the tsrx-default switch the demo is authored in **tsrx** (`.tsrx`): basic examples mirror the guide; advanced examples are a todo list, snake game, and minesweeper. Entry is [examples/main.ts](examples/main.ts), loaded by the root [index.html](index.html); [examples/runtime.ts](examples/runtime.ts) re-exports [tsrx/runtime.ts](tsrx/runtime.ts) so the tree (a sibling of `tsrx/`) resolves the runtime; [examples/tsconfig.json](examples/tsconfig.json) governs `.tsrx` editor types.
- [examples/plain-typescript/](examples/plain-typescript/) — the previous plain-RxJS demo, demoted to a reference (not wired to a build). Mirrors the [plain-TypeScript docs](docs/plain-typescript.md).
- [docs/](docs/) — `getting-started.md`, `guide.md` (tsrx walkthrough), `plain-typescript.md` (plain reference). The root [README.md](README.md) is a lean landing page linking into them. (Slated to move to the github.io site later.)

### Library internals (`src/lib/rxfm/`)

- [components/component.ts](src/lib/rxfm/components/component.ts) — fundamental types (`Component`, `ElementType`, `ComponentOperator`) and factories: `componentFunction`, `componentCreator`, `componentOperator` (wraps `switchTap`), `sideEffect`.
- [components/html.ts](src/lib/rxfm/components/html.ts) / [components/svg.ts](src/lib/rxfm/components/svg.ts) — the public element creators: `Div`, `Span`, `Button`, … and SVG equivalents, each via `htmlComponentCreator`/`svgComponentCreator`. These take children as args or as a tagged template (`` Div`hi ${Span}` ``).
- [children/children.ts](src/lib/rxfm/children/children.ts) — `children`/`lastChildren` operators. Coerces any `ComponentChild` (strings, numbers, observables, elements, element arrays, functions) into element streams, diffs them via [child-differ.ts](src/lib/rxfm/children/child-differ.ts), and patches the real DOM.
- [attributes/](src/lib/rxfm/attributes/) — `attributes`/`attribute` (Proxy gives per-key operators like `attribute.id(...)`), `styles`/`style`, `classes`, plus HTML/SVG attribute type maps.
- [events.ts](src/lib/rxfm/events.ts) — `events`/`event` operators built on RxJS `fromEvent`. `event` is a Proxy exposing per-type operators (`event.click(handler)`) as well as `event('click', handler)`.
- [map-to-components.ts](src/lib/rxfm/map-to-components.ts) — `mapToComponents(creationFn, idPropOrFn?)`, the keyed-list operator (like React `key`). Creation function first; optional second arg is an id function or item-prop name (defaults to array index). Diffs item arrays by id so DOM elements are reused, not recreated. Prefer over `switchMap` for arrays.
- [utils/utils.ts](src/lib/rxfm/utils/utils.ts) — RxJS helpers: `select`/`selectFrom`/`watch`/`destructure` (distinct-only variants of `pluck`/`map`), `conditional`, `reuse` (shareReplay), boolean logic (`and`/`or`/`not`/`nand`/`nor`), `switchTap`, `access`, `using`, `log`.
- [operator-isolation-service.ts](src/lib/rxfm/operator-isolation-service.ts) — **key design piece.** A singleton holding a `WeakMap<element, metadata>` so that multiple instances of the same operator (e.g. two `styles` calls, or `children` + `lastChildren`) on one element don't clobber each other. WeakMap so removed elements can be GC'd. `TestOperatorIsolationService` adds inspection methods for tests.

## How it fits together

`` Div`hi`.pipe(classes('x')) `` → `htmlComponentCreator('div')('hi')` produces `defer(() => of(document.createElement('div')))` piped through the `children` operator, then `.pipe(classes('x'))`. The result is an `Observable<HTMLDivElement>`. Operators are `MonoTypeOperatorFunction`s that perform DOM side effects and re-emit the same element. **Note: component operators execute in reverse order (last operator handled first).**

State is just RxJS `BehaviorSubject`s declared inside component functions (so instances don't share state) — used like React's `useState` but changes propagate to the DOM immediately, no render wait.

## Build & tooling

This repo uses **Yarn (Classic, v1)** — run `yarn`, not `npm`. Requires Node `^20.19 || >=22.12`.

- **Vite 8** builds both the library and the demo (replaced webpack in v3.0.0). Two configs:
  [vite.lib.config.ts](vite.lib.config.ts) (library) and [vite.config.ts](vite.config.ts) (demo).
  The demo config loads the `tsrx()` Vite plugin ([tsrx/vite-plugin-tsrx.ts](tsrx/vite-plugin-tsrx.ts))
  so it can compile the `.tsrx` examples, and adds `.tsrx` to `resolve.extensions` for bare
  cross-file imports. The plugin `require`s the **compiled** `tsrx/ts-plugin/transform.cjs`, so
  `dev`/`build:app` run `build:tsrx` first (`predev`/`prebuild:app` hooks) to regenerate it from the
  `.cts` sources (the `.cjs` are gitignored build artifacts — see [Library internals] / the tsrx
  TypeScript build below).
- `yarn dev` — Vite dev server (port 3000) serving the tsrx demo from `examples/` (entry
  `examples/main.ts`). The demo's `rxfm` import is aliased to live lib source (`src/lib/rxfm/index.ts`).
- `yarn build` — builds the **library** to `dist/` → `index.mjs` (ESM), `index.cjs` (CJS), and the
  declaration tree (`index.d.ts` + `rxfm/**.d.ts`) via `vite-plugin-dts`. `rxjs` is externalised
  (`external: [/^rxjs/]`), not bundled. This is what npm publishes (`files: ["dist"]`).
- `yarn build:app` — builds the demo to **`dist-demo/`** (kept out of the published `dist/`). The
  GitHub Pages demo is deployed manually, so point the deploy at `dist-demo/`.
- `yarn preview` — serve the built demo.
- `yarn test` / `yarn test:watch` — Jest 30 (ts-jest, jsdom), scoped to `src/`. Config is [jest.config.cjs](jest.config.cjs) (`.cjs` because the package is `type: module`). Main test: [components/component.test.ts](src/lib/rxfm/components/component.test.ts).
- `yarn test:e2e` — Playwright end-to-end tests in [e2e/](e2e/), run against the Vite dev server (auto-started). Config: [playwright.config.ts](playwright.config.ts). Needs `yarn playwright install chromium` once.
- `yarn lint` — ESLint (8 + typescript-eslint 7) over `.ts`. Currently 0 errors, a few `semi` warnings.
- **VS Code extension** ([tsrx/vscode-extension/](tsrx/vscode-extension/), npm-managed, not a Yarn
  workspace — Yarn Classic would require a private root, but `rxfm` publishes from root). Root
  passthrough scripts avoid `cd`ing in: `yarn extension:install-deps` (one-time), `yarn
  extension:build` (produce the `.vsix`), `yarn extension:build-and-install` (build + `code
  --install-extension`), `yarn extension:bump-version` (patch bump). Each delegates to the
  extension's own npm scripts. `package`/`reinstall` delete any old `tsrx-vscode-*.vsix` first, so
  exactly one build is on disk; it's git-tracked via the `!/tsrx/vscode-extension/*.vsix` exception
  in `.gitignore`. The extension contributes a `language-configuration.json` (mirrors TypeScript's)
  for `.tsrx` comment-toggling, auto-indent, and bracket/quote surround.

## Conventions & notes

- Package is ESM-first (`"type": "module"`); published output is dual ESM/CJS via the `exports` map.
- TypeScript ^5.6, `module/moduleResolution` = `ESNext`/`bundler`. No `jsx` settings (removed with JSX).
- Components are PascalCase. The only `subscribe` in an app should be the root.
- The `rxfm` import inside the lib resolves via tsconfig `paths` to `src/lib/rxfm/index`; in the demo it resolves via the Vite alias.
- TS 5's DOM typings dropped some deprecated tags, so a few element creators were removed (`Dir`, `Font`, `Frame`, `Frameset`, `Marquee`, `Param`).
- Code style: heavy JSDoc on exported functions, functional/observable-pipeline style. Match it when editing.
- CHANGELOG.md follows Keep a Changelog; bump it on user-facing changes. CI ([.github/workflows/nodejs.yml](.github/workflows/nodejs.yml)) runs build + lint + test on Node 20/22, plus a separate Playwright e2e job, for push/PR to master.
