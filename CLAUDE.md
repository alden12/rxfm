# RxFM

An experimental web framework built on RxJS. The core idea: **a component is just an `Observable<HTMLElement | SVGElement>`**. There is no virtual DOM and no re-render cycle — elements are reactive simply because they're observable streams. A single `subscribe` at the app root sets the whole app in motion; everything else piggybacks on that subscription.

- Published to npm as `rxfm` (v2.1.x). `rxjs ^7.0.0` is a peer dependency.
- Authored by Alden Laslett (this repo's owner). MIT licensed.
- Live demo: https://alden12.github.io/rxfm/ · Starter app: https://github.com/alden12/rxfm-starter

## Layout

- [src/lib/rxfm/](src/lib/rxfm/) — the framework itself (what gets published).
- [src/lib/index.ts](src/lib/index.ts) — package entry, re-exports `src/lib/rxfm`.
- [src/app/](src/app/) — example/demo app (NOT published; see `files: ["dist"]` in package.json). Basic examples mirror the README; advanced examples are a todo list, snake game, and minesweeper.

### Library internals (`src/lib/rxfm/`)

- [components/component.ts](src/lib/rxfm/components/component.ts) — fundamental types (`Component`, `ElementType`, `ComponentOperator`, `FC`) and factories: `componentFunction`, `componentCreator`, `componentOperator` (wraps `switchTap`), `sideEffect`.
- [rxfm-jsx/rxfm-jsx.ts](src/lib/rxfm/rxfm-jsx/rxfm-jsx.ts) — the JSX factory `RxFM.createElement` (set as `jsxFactory` in tsconfig). Declares the `RxFM.JSX` namespace and intrinsic element types. Splits props into attributes vs `on*` event handlers, then pipes `classes`/`styles`/`attributes`/`events` operators onto the component. `FC<Props>` is the function-component type.
- [children/children.ts](src/lib/rxfm/children/children.ts) — `children`/`lastChildren` operators. Coerces any `ComponentChild` (strings, numbers, observables, elements, element arrays, functions) into element streams, diffs them via [child-differ.ts](src/lib/rxfm/children/child-differ.ts), and patches the real DOM.
- [attributes/](src/lib/rxfm/attributes/) — `attributes`/`attribute` (Proxy gives per-key operators like `attribute.id(...)`), `styles`, `classes`, plus HTML/SVG attribute type maps.
- [events.ts](src/lib/rxfm/events.ts) — `events`/`event` operators built on RxJS `fromEvent`. `event` is a Proxy exposing per-type operators (`event.click(handler)`).
- [map-to-components.ts](src/lib/rxfm/map-to-components.ts) — `mapToComponents`, the keyed-list operator (like React `key`). Diffs item arrays by id so DOM elements are reused, not recreated. Prefer over `switchMap` for arrays.
- [utils/utils.ts](src/lib/rxfm/utils/utils.ts) — RxJS helpers: `select`/`selectFrom`/`watch`/`destructure` (distinct-only variants of `pluck`/`map`), `conditional`, `reuse` (shareReplay), boolean logic (`and`/`or`/`not`/`nand`/`nor`), `switchTap`, `access`, `log`.
- [operator-isolation-service.ts](src/lib/rxfm/operator-isolation-service.ts) — **key design piece.** A singleton holding a `WeakMap<element, metadata>` so that multiple instances of the same operator (e.g. two `styles` calls, or `children` + `lastChildren`) on one element don't clobber each other. WeakMap so removed elements can be GC'd. `TestOperatorIsolationService` adds inspection methods for tests.

## How it fits together

JSX `<div class="x">hi</div>` → `RxFM.createElement('div', {class:'x'}, 'hi')` → `htmlComponentCreator('div')('hi')` produces `defer(() => of(document.createElement('div')))` piped through the `children` operator, then `.pipe(classes('x'))`. The result is an `Observable<HTMLDivElement>`. Operators are `MonoTypeOperatorFunction`s that perform DOM side effects and re-emit the same element. **Note: component operators execute in reverse order (last operator handled first).**

State is just RxJS `BehaviorSubject`s declared inside component functions (so instances don't share state) — used like React's `useState` but changes propagate to the DOM immediately, no render wait.

## Commands

- `npm start` — dev server (webpack-dev-server) serving the example app from `src/app`.
- `npm run build` — production build of the **library** to `dist/` (webpack.prod.js).
- `npm run build:app` — build the demo app (webpack.app.js; used for the GitHub Pages demo).
- `npm test` / `npm run test:watch` — Jest (ts-jest, jsdom env). Tests are sparse — main one is [components/component.test.ts](src/lib/rxfm/components/component.test.ts).
- `npm run lint` — ESLint over `.ts`.

## Conventions & notes

- TypeScript-first; `jsx: "react"`, `jsxFactory: "RxFM.createElement"`. **Every `.tsx` file must `import RxFM from 'rxfm'`** for JSX to compile (and the default root export exists specifically to make TS's JSX namespace detection work — see CHANGELOG 2.1.1).
- Components are PascalCase. The only `subscribe` in an app should be the root.
- The `rxfm` import inside the lib resolves via tsconfig `paths` to `src/lib/rxfm/index`.
- Code style: heavy JSDoc on exported functions, functional/observable-pipeline style. Match it when editing.
- CHANGELOG.md follows Keep a Changelog; bump it on user-facing changes. CI ([.github/workflows/nodejs.yml](.github/workflows/nodejs.yml)) runs build + test on push/PR to master.
