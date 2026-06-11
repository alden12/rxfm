# Corrente

An experimental web framework built on RxJS. The core idea: **a component is just an `Observable<HTMLElement | SVGElement>`**. There is no virtual DOM and no re-render cycle — elements are reactive simply because they're observable streams. A single `subscribe` at the app root sets the whole app in motion; everything else piggybacks on that subscription.

- Published to npm as `corrente` (v3.x). `rxjs ^7.0.0` is a peer dependency.
- Authored by Alden Laslett (this repo's owner). MIT licensed.
- Live demo: https://alden12.github.io/rxfm/ · Starter app: https://github.com/alden12/rxfm-starter
- **No JSX.** As of v3.0.0 the JSX factory was removed; components are written with the plain
  function API (`Div`, `Span`, `Button`, … + tagged templates + operators). JSX may return in a
  redesigned form later. (The pre-v3 JSX layer lived in a `src/corrente/rxfm-jsx/` directory.)

## Layout

- [src/corrente/](src/corrente/) — the framework itself (what gets published).
- [src/index.ts](src/index.ts) — package entry, re-exports `src/corrente` (named exports only, no default).
- [src/app/](src/app/) — example/demo app (NOT published; see `files: ["dist"]` in package.json). Basic examples mirror the README; advanced examples are a todo list, snake game, and minesweeper. Entry is [src/app/index.ts](src/app/index.ts), loaded by the root [index.html](index.html).

### Library internals (`src/corrente/`)

- [components/component.ts](src/corrente/components/component.ts) — fundamental types (`Component`, `ElementType`, `ComponentOperator`) and factories: `componentFunction`, `componentCreator`, `componentOperator` (wraps `switchTap`), `sideEffect`.
- [components/html.ts](src/corrente/components/html.ts) / [components/svg.ts](src/corrente/components/svg.ts) — the public element creators: `Div`, `Span`, `Button`, … and SVG equivalents, each via `htmlComponentCreator`/`svgComponentCreator`. These take children as args or as a tagged template (`` Div`hi ${Span}` ``).
- [children/children.ts](src/corrente/children/children.ts) — `children`/`lastChildren` operators. Coerces any `ComponentChild` (strings, numbers, observables, elements, element arrays, functions) into element streams, diffs them via [child-differ.ts](src/corrente/children/child-differ.ts), and patches the real DOM.
- [attributes/](src/corrente/attributes/) — `attributes`/`attribute` (Proxy gives per-key operators like `attribute.id(...)`), `styles`/`style`, `classes`, plus HTML/SVG attribute type maps.
- [events.ts](src/corrente/events.ts) — `events`/`event` operators built on RxJS `fromEvent`. `event` is a Proxy exposing per-type operators (`event.click(handler)`) as well as `event('click', handler)`.
- [map-to-components.ts](src/corrente/map-to-components.ts) — `mapToComponents(creationFn, idPropOrFn?)`, the keyed-list operator (like React `key`). Creation function first; optional second arg is an id function or item-prop name (defaults to array index). Diffs item arrays by id so DOM elements are reused, not recreated. Prefer over `switchMap` for arrays.
- [utils/utils.ts](src/corrente/utils/utils.ts) — RxJS helpers: `select`/`selectFrom`/`watch`/`destructure` (distinct-only variants of `pluck`/`map`), `conditional`, `reuse` (shareReplay), boolean logic (`and`/`or`/`not`/`nand`/`nor`), `switchTap`, `access`, `using`, `log`.
- [operator-isolation-service.ts](src/corrente/operator-isolation-service.ts) — **key design piece.** A singleton holding a `WeakMap<element, metadata>` so that multiple instances of the same operator (e.g. two `styles` calls, or `children` + `lastChildren`) on one element don't clobber each other. WeakMap so removed elements can be GC'd. `TestOperatorIsolationService` adds inspection methods for tests.

## How it fits together

`` Div`hi`.pipe(classes('x')) `` → `htmlComponentCreator('div')('hi')` produces `defer(() => of(document.createElement('div')))` piped through the `children` operator, then `.pipe(classes('x'))`. The result is an `Observable<HTMLDivElement>`. Operators are `MonoTypeOperatorFunction`s that perform DOM side effects and re-emit the same element. **Note: component operators execute in reverse order (last operator handled first).**

State is just RxJS `BehaviorSubject`s declared inside component functions (so instances don't share state) — used like React's `useState` but changes propagate to the DOM immediately, no render wait.

## Build & tooling

This repo uses **Yarn (Classic, v1)** — run `yarn`, not `npm`. Requires Node `^20.19 || >=22.12`.

- **Vite 8** builds both the library and the demo (replaced webpack in v3.0.0). Two configs:
  [vite.lib.config.ts](vite.lib.config.ts) (library) and [vite.config.ts](vite.config.ts) (demo).
- `yarn dev` — Vite dev server (port 3000) serving the demo from `src/app`. The demo's `corrente`
  import is aliased to live lib source (`src/corrente/index.ts`).
- `yarn build` — builds the **library** to `dist/` → `index.mjs` (ESM), `index.cjs` (CJS), and the
  declaration tree (`index.d.ts` + `corrente/**.d.ts`) via `vite-plugin-dts`. `rxjs` is externalised
  (`external: [/^rxjs/]`), not bundled. This is what npm publishes (`files: ["dist"]`).
- `yarn build:app` — builds the demo to **`dist-demo/`** (kept out of the published `dist/`). The
  GitHub Pages demo is deployed manually, so point the deploy at `dist-demo/`.
- `yarn preview` — serve the built demo.
- `yarn test` / `yarn test:watch` — Jest 30 (ts-jest, jsdom), scoped to `src/`. Config is [jest.config.cjs](jest.config.cjs) (`.cjs` because the package is `type: module`). Main test: [components/component.test.ts](src/corrente/components/component.test.ts).
- `yarn test:e2e` — Playwright end-to-end tests in [e2e/](e2e/), run against the Vite dev server (auto-started). Config: [playwright.config.ts](playwright.config.ts). Needs `yarn playwright install chromium` once.
- `yarn lint` — ESLint (8 + typescript-eslint 7) over `.ts`. Currently 0 errors, a few `semi` warnings.
- **Reactive TS** — the experimental `.rts` language layer, in [reactive-ts/](reactive-ts/) (formerly
  "tsrx" / `.tsrx`; renamed off a name-clash with an unrelated TS UI extension). Imperative-observable
  code in `.rts` files is transformed to real RxJS with live editor types. The transform + Volar
  tsserver plugin live in [reactive-ts/ts-plugin/](reactive-ts/ts-plugin/) (`.cts` sources → gitignored
  `.cjs`, built by `yarn build:reactive-ts`); the Vite plugin is
  [reactive-ts/vite-plugin-reactive-ts.ts](reactive-ts/vite-plugin-reactive-ts.ts) (`reactiveTs()`,
  served via `yarn dev:reactive-ts`); fixtures are in [reactive-ts/fixtures/](reactive-ts/fixtures/)
  (the `reactive-ts` Jest project). Editor language id is `rts`. Published separately on npm under the
  `@reactive-ts/*` scope; the runtime framework is being renamed to Corrente.
- **VS Code extension** ([reactive-ts/vscode-extension/](reactive-ts/vscode-extension/), npm-managed, not a Yarn
  workspace — Yarn Classic would require a private root, but `corrente` publishes from root). Root
  passthrough scripts avoid `cd`ing in: `yarn extension:install-deps` (one-time), `yarn
  extension:build` (produce the `.vsix`), `yarn extension:build-and-install` (build + `code
  --install-extension`), `yarn extension:bump-version` (patch bump). Each delegates to the
  extension's own npm scripts. `package`/`reinstall` delete any old `reactive-ts-vscode-*.vsix` first, so
  exactly one build is on disk; it's git-tracked via the `!/reactive-ts/vscode-extension/*.vsix` exception
  in `.gitignore`. The extension contributes a `language-configuration.json` (mirrors TypeScript's)
  for `.rts` comment-toggling, auto-indent, and bracket/quote surround.

## Conventions & notes

- Package is ESM-first (`"type": "module"`); published output is dual ESM/CJS via the `exports` map.
- TypeScript ^5.6, `module/moduleResolution` = `ESNext`/`bundler`. No `jsx` settings (removed with JSX).
- Components are PascalCase. The only `subscribe` in an app should be the root.
- The `corrente` import inside the lib resolves via tsconfig `paths` to `src/corrente/index`; in the demo it resolves via the Vite alias.
- TS 5's DOM typings dropped some deprecated tags, so a few element creators were removed (`Dir`, `Font`, `Frame`, `Frameset`, `Marquee`, `Param`).
- Code style: heavy JSDoc on exported functions, functional/observable-pipeline style. Match it when editing.
- CHANGELOG.md follows Keep a Changelog; bump it on user-facing changes. CI ([.github/workflows/nodejs.yml](.github/workflows/nodejs.yml)) runs build + lint + test on Node 20/22, plus a separate Playwright e2e job, for push/PR to master.
