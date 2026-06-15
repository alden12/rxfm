# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `State<T>`, Corrente's name for RxJS's `BehaviorSubject`, exported from the root
  (`import { State } from 'corrente'`). Clearer for newcomers, and because it requires an initial
  value it always emits on subscription (a fold or derived view shows something on load), unlike a
  plain `Subject`, which stays silent until its first `.next()`. It is a `BehaviorSubject` subclass
  (no behavioural change, full RxJS interop); the class name is pinned so it surfaces as `State` in
  stack traces, devtools, and error logs. Adds one method, `update(current => next)`, sugar for
  `next(value-derived-from-current)` (`count.update(c => c + 1)`) so the common read-then-write no
  longer repeats the variable three times. Its `next` also de-duplicates by reference (`===`):
  re-emitting the value it already holds is a no-op, so a `State` wired to the DOM doesn't trigger
  redundant updates when a write doesn't actually change anything (the same distinct-by-reference
  behaviour the Reactive TS `render` boundary gives derived streams).
- Fluent operator methods on `Observable`, mirroring the [WICG Observable proposal](https://github.com/WICG/observable):
  `map`, `filter`, `take`, `drop`, `takeUntil`, `catch`, `finally`, `flatMap`, plus `scan` (running
  fold) and `debounce`/`throttle`. `source.map(...).filter(...)` now reads as a chain alongside
  `source.pipe(...)`. Importing `corrente` augments `Observable.prototype` (each method guarded, so a
  future native/RxJS method takes precedence). The proposal's terminal, Promise-returning operators
  (`reduce`, `toArray`, `some`, `every`, `find`, `forEach`) are intentionally omitted: they fire on
  completion, and Corrente streams never complete, so the Promise would never resolve.
- Static arrays of children may now be passed directly to a component, without spreading:
  `Div(items.map(Item))` (and nested arrays) work the same as `Div(...items.map(Item))`. Arrays may
  be mixed with other children and used inside tagged templates (`` Div`${items.map(Item)}` ``).
  Previously a non-template array threw, and an array interpolated into a template was rendered as
  text. `ComponentChild` now includes `ComponentChild[]`. (For a list whose membership changes over
  time, keep emitting an `ElementType[]` from an observable — see `mapToComponents`.)
- The Reactive TS runtime now ships with the package and is exported from the root: `render`,
  `RenderObservable`, `accumulate`, `interval`, `timer`, `frames`, `animate`, and `EMPTY` are
  importable via `import { accumulate, interval } from 'corrente'`. These are useful with plain
  corrente too: a shared/replaying derived value (`render`/`RenderObservable`), a running fold
  (`accumulate`), reactive clocks (`interval`/`timer`/`frames`), and a tween (`animate`). The
  Reactive TS transform still injects `render` from a local `runtime.ts`, which can now be a one-line
  `export * from 'corrente'`.
- `frames()` and `animate(target, { duration, easing?, from? })` animation helpers, driven by the
  browser's animation frames. `frames()` is the `requestAnimationFrame` sibling of `interval`/`timer`:
  it emits the elapsed milliseconds since subscription, once per display frame, and runs until you stop
  listening - the open-ended workhorse for continuous motion (`frames().map(ms => (ms * 0.06) % 360)`
  spins forever). `animate` is that clock plus an easing curve and a stop time: it eases a value to a
  `target` (a number or a stream of targets, e.g. a `State`) over `duration`, from its current position
  so a moving target retargets smoothly mid-flight (the `useSpring`/`animate` shape), then **completes**
  on the final frame. Pin `from` for a one-shot `animate(360, { from: 0, duration: 1000 })`. Being
  frame-driven (not a fixed `timer`) progress is read from real elapsed time, so the duration is correct
  at any refresh rate; both pause in background tabs; and both cancel their `requestAnimationFrame` on
  teardown with the rest of the graph - no leak, no stop condition to write. `animate` hides the
  per-target stream-of-streams switch the same way `interval`/`timer` hide the reactive-period switch.
- `interval(period)` and `timer(due, period?)` clock helpers, keeping RxJS's shapes but with
  **liftable inputs**. `interval` fires after each `period` (the first tick is delayed); `timer`
  fires after `due` then every `period`, so `timer(0, p)` is the immediate-start companion to
  `interval(p)`'s delayed start, and `timer(due)` (no period) is a one-shot. Any argument may be a
  `number` or an `Observable<number | null>`: when it's a stream the clock rebuilds at the new
  timing whenever it changes (a difficulty-driven game speed Just Works), and resolving to `null`
  turns the clock off (`EMPTY`), so the filter idiom `running ? rate : null` gates it. That
  restart-on-change is a stream-of-streams switch, the one shape lifting fundamentally can't
  express, so it lives here as a named helper rather than an inline `switchMap`.
- `fallback(source, handler)` runtime helper (with the `RETRY` sentinel) — stream error handling that
  reads like a `try/catch` body, folding `catchError` *and* `retry` into one. When `source` errors,
  `handler` runs with `(error, attempt)` and its **return value** decides what happens, the way a `catch`
  block does: return `RETRY` to resubscribe and try again (`attempt` increments), return nothing
  (`e => console.error(e)`) to swallow and complete, return a plain value (`() => "error"`, `() => null`)
  to emit it once, or return an `Observable` (`() => of(0)`) to switch to it. So retry-then-recover is a
  single call: `fallback(x, (e, n) => n < 3 ? RETRY : 0)`. It sits alongside `accumulate`/`interval` on
  the `corrente` runtime surface and, being operator-style (it takes the stream as a parameter), the Reactive
  TS transform leaves the call untouched in `.rts`. A named helper rather than `try/catch` sugar:
  `try { obs }` reads as "if evaluating `obs` throws now," but an observable errors *later* on
  subscription, so `try/catch` would mislead — `fallback` keeps handling honestly at the stream level.

- **The demo example app is now a live doc-site.** A sidebar-nav shell (authored in Reactive TS,
  `site/app.rts`) renders the README and `docs/*` markdown with **live, runnable demos spliced in**:
  a code fence annotated `` ```ts demo=<id> `` stays an ordinary code block on GitHub but, in the app,
  mounts the matching example component beneath the snippet (code and result shown together), with a
  "view full source" expander pulling the example's real `.rts` via Vite `?raw`. Built with `marked` +
  `highlight.js` and styled with a **dark** Tailwind v4 theme (`@tailwindcss/typography` `prose` for the
  rendered markdown, github-dark for code) whose colours and sizing are centralized as CSS-variable design
  tokens (`@theme` + `:root` in `site/app-styles.css`) so the whole site can be re-themed in one place. The
  example components and the docs they illustrate stay in sync because the running demo *is* the real
  example. The demo folder is `site/` (it's a doc-site, not just examples). `yarn dev` now serves on
  **port 3001**.

### Changed
- The `reactiveTs()` Vite plugin now skips `?raw`/`?url`/`?inline` queries, so a `.rts` file's source can
  be imported as text (used by the doc-site to show each example's real source). Previously the plugin
  compiled even the raw-import variant, returning JS instead of the source.
- Docs and examples now mount the app root with `addToView(App)` rather than a raw
  `App.subscribe(el => document.body.appendChild(el))`. `addToView` is the safe spelling of that
  single root subscription — it swaps the element if the root component ever re-emits (which a bare
  `appendChild` would duplicate) and returns a teardown function.
- **Docs & examples restructured around Reactive TS as the default style.** The README is now a lean
  landing page; the full docs live in `docs/` (`getting-started.md`, `guide.md` for the Reactive TS
  walkthrough, `plain-typescript.md` for the plain-RxJS reference). The demo example app moved to a
  top-level `site/` directory and is now authored in Reactive TS (`.rts`) — `yarn dev` /
  `yarn build:app` compile it via the Reactive TS Vite plugin. The previous plain-TypeScript demo is
  preserved as a reference at `site/plain-typescript/`. No library/runtime code changed.
- **Renamed the framework `rxfm` → `corrente`.** The published package is now `corrente`
  (`import { Div } from 'corrente'`); the source moved to `src/corrente/` and the redundant `src/lib/`
  layer was dropped, so the package entry is now `src/index.ts`; the Vite alias / tsconfig path and the
  library declaration tree (`dist/corrente/**`) follow suit; and the Reactive TS transform now emits its
  component imports (`mapToComponents`, …) from `corrente`. The GitHub repo and github.io demo URLs are
  intentionally left as `rxfm` for now (the repository itself isn't renamed yet).

### Fixed
- Reactive TS now guards a lifted ternary's condition with `distinctUntilChanged` before the
  `switchMap`, so `cond ? a : b` only switches branches when the condition actually flips rather
  than re-subscribing on every upstream emission. This keeps a gated clock such as
  `interval(running ? 100 : null)` from being torn down and rebuilt while `running` stays the same,
  which previously dropped or restarted ticks.

### Removed
- Removed the `flatten` utility (one-level array flatten). It predated `Array.prototype.flat` and
  is now redundant — use the native `array.flat()` instead. (`recursiveFlatten`, for arbitrary
  depth, is unchanged.)

## [3.0.0-alpha.1] - 2026-06-05

### Added
- Fluent event methods on element creators: `` Div.onClick(handler)`text` `` is sugar for
  `` Div`text`.pipe(event.click(handler)) ``. Every event in `ElementEventMap` has a corresponding
  `on<EventName>` method (`onClick`, `onInput`, …), plus a generic `on(type, handler)` form, and
  the methods may be chained (`Button.onClick(a).onMouseenter(b)`). The new `chainable` helper and
  `ChainableComponentCreator` type are exported for use with custom component creators.
- Fluent `class` method on element creators: `` Div.class('btn', isActive)`text` `` is sugar for
  `` Div`text`.pipe(classes('btn', isActive)) ``, taking the same arguments as the `classes`
  operator and chainable with the event methods.
- Fluent `style` method (`` Div.style({ color: 'red' })`text` `` → `styles(...)`) and per-attribute
  methods (`` Input.type('text').placeholder('…')() `` → the `attribute` operator) on element
  creators, chainable with the event and class methods. A generic `attr(name, value)` method covers
  attributes not in the typed map (`data-*`, `aria-*`, and other custom attributes).

## [3.0.0-alpha.0] - 2026-06-04

### Removed
- Removed JSX/TSX support: the `RxFM` default export (`RxFM.createElement`), the `FC` type, and
  the `DefaultProps`/`ElementChild` JSX types. Components are written with the non-JSX API
  (`Div`, `Span`, `Button`, … and the `attributes`/`events`/`classes`/`styles` operators), as in
  v2.0.0. JSX support may be reintroduced in a redesigned form in a future release.
- Removed deprecated HTML component creators no longer present in the DOM typings: `Dir`, `Font`,
  `Frame`, `Frameset`, `Marquee`, `Param`.

### Added
- Playwright end-to-end tests for the demo app (`yarn test:e2e`), run in CI.

### Changed
- Replaced webpack with Vite 8 for both the library build and the demo app.
- The published package now ships ES modules and CommonJS (`dist/index.mjs`, `dist/index.cjs`)
  with an `exports` map and bundled TypeScript declarations (`dist/index.d.ts` + `dist/rxfm/`).
- Switched package management from npm to Yarn (Classic).
- Modernised tooling: TypeScript ^5.6, Jest ^30, ESLint ^8, Vite ^8. Node engine is now
  `^20.19.0 || >=22.12.0` (CI runs on Node 20 and 22).
- The demo example app was reverted to the non-JSX API.

## [2.1.1] - 2022-01-03

### Fixed
- Fixed TypeScript JSX namespace detection by adding default RxFM root export.

## [2.1.0] - 2022-01-02

### Added
- Added JSX/TSX support to RxFM.

### Changed
- Updated TypeScript version to ^4.5.4, removed deprecated `applet` html component creator.

### Deprecated
- Deprecated `DestroySubject`.
- Deprecated `ConditionalOptions` overload in `conditional` operator.

## [2.0.0] - 2021-11-26

### Added
- Added generic `switchTap` operator to inject an observable side effect into the stream.

### Changed
- Reversed order of `mapToComponents` arguments. Made item index the default id if no id function is provided. Added ability to pass an item key name to derive id from.
- Changed names of `notGate`, `andGate`, `nandGate`, `orGate` and `norGate` observable boolean logic functions to `not`, `and`, `nand`, `or` and `nor` respectively.

## [1.0.0-beta.1] - 2021-07-08
### Added
- Added proxies to access individual style, attribute, and event operators as properties of their respective operators.
- Added ability to pass classes and individual style, and attribute operators as tagged templates.
- Added `access` utility function to access an object property using an observable.
- Added overload to `conditional` utility function to allow passing arguments as an options object.

## [1.0.0-beta.0] - 2021-05-26
### Removed
- Removed deprecated utils: watchFrom, distinctUntilKeysChanged, gate, mapToLatest, conditionalMapTo, stopPropagation, ternary, filterObject, REF_COUNT.

## [1.0.0-alpha.12] - 2021-05-19
### Removed
- Removed debounce from component child updates to make them synchronous at the cost of efficiency for simultaneous changes in component children.

## [1.0.0-alpha.11] - 2021-05-18
### Changed
- Updated RxJS peer dependency to ^7.0.0.
- Updated ES compilation target to ES2015.
- Updated TypeScript version to ^4.2.4.

### Deprecated
- Deprecated unused or duplicated utility functions: watchFrom, distinctUntilKeysChanged, gate, mapToLatest, conditionalMapTo, stopPropagation, ternary, filterObject.
- Deprecated unused REF_COUNT constant for shareReplay.
