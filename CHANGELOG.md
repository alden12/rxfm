# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
