# Changelog

All notable changes to the tsrx VS Code extension.

## [0.0.12]

### Added
- **Destructuring a component-`.map` item param** now works:
  `board.flat().map(({ color, symbol }, index) => …)`. Each field is treated as a stream of that
  field (`color` → `item.pipe(map(item => item.color))`), and fields of one item share the stream, so
  a multi-field expression collapses to a single `map` — same output as reading `cell.color`. Only
  plain-field patterns qualify (no rest, defaults, computed names, or nesting). Both the field's
  *uses* and its declaration in the `{ … }` pattern map back to the generated property token, so
  hover / go-to-def resolve a real type on the destructured name (e.g. `(property) color: string`)
  rather than nothing. (The type shown is the emitted field type, matching how `cell.color` reads —
  not `Observable<…>`; the stream wrapping is the lift's job, kept out of the value view.)

## [0.0.11]

### Changed
- A ternary whose observables all root in one value (e.g. `x === undefined ? 0 : x + 1`,
  `cell.symbol ? '12px' : '14px'`) now lifts to a single `map` with a plain ternary inside, so
  TypeScript's narrowing applies in each branch (no more spurious "possibly undefined"). Ternaries
  with a stream branch keep the lazy `switchMap` form.

## [0.0.10]

### Added
- Lifting now reaches more positions, so an observable value no longer has to be pulled out into a
  named `const` before use:
  - **Destructuring** an observable: `const { board, stage } = game` lifts each field.
  - **Object-literal values**: `.style({ backgroundColor: cell.color })` lifts `cell.color` in place.
  - **Call arguments**: a `.class(cond ? 'a' : 'b')` flag or a conditional child lifts in place.
- **Event-handler closures that capture a stream** are lifted to a stream of handlers, so
  `onClick(() => dispatch(indexToVector(index)))` works when `index` is a stream. Streams used via
  their API (`subject.next(…)`) are left alone.

## [0.0.9]

### Fixed
- A bare cross-`.tsrx` import (`import { x } from './engine'`) now resolves in the editor. 0.0.8's
  `resolveHiddenExtensions` was necessary but insufficient: Volar only consults it when a file
  already imports something with a literal `.tsrx` suffix, so a plain `./engine` specifier fell
  through to stock TS resolution (which doesn't know `.tsrx`) and reported "Cannot find module". The
  plugin now layers a fallback over the host's module resolution that maps any leftover unresolved
  relative import to a sibling `.tsrx` file (served as `.ts`). A reactive "engine" module and its
  view can now live in separate `.tsrx` files, and a derivation over an imported reactive value
  still lifts with its real type.

## [0.0.8]

### Changed
- Enabled Volar's `resolveHiddenExtensions` toward editor-side cross-`.tsrx` imports. This turned out
  to be necessary but not sufficient on its own — see 0.0.9 for the completing fix.

## [0.0.7]

### Added
- Cross-`.tsrx` imports resolve with real types, so a derivation over a reactive value
  imported from another `.tsrx` file still lifts — you can split a reactive "engine"
  module from its view.
- The `cond ? value : EMPTY` filter idiom (and `EMPTY` is re-exported from the runtime).
  A warning flags when an EMPTY-able value is combined with another stream, since
  `combineLatest` stalls until it first emits.

### Changed
- A chain of property accesses on a stream (`state.trail.coordinates`) now lifts to a
  single `map` instead of one per hop.

## [0.0.6]

### Added
- Element access with an observable index over a static object now lifts —
  `CELL_COLOR_MAP[cell]` becomes `cell.pipe(map(cell => CELL_COLOR_MAP[cell]))`. Previously only an
  observable *object* lifted, so a constant lookup table indexed by a stream needed a wrapper
  function; now the lookup can be written directly.

## [0.0.5]

### Fixed
- Operator-style calls now lift a liftable *argument* in place — e.g.
  `interval(periodFor(difficulty))` transforms the inner `periodFor(difficulty)` instead of emitting
  the call verbatim (which type-errored). Previously the argument had to be lifted at a separate
  binding first.

### Added
- `interval(period)` and `accumulate(source, reducer, seed)` runtime helpers, and `RenderObservable`
  is now distinct-by-reference (a derivation from an unchanged value no longer touches the DOM).

## [0.0.4]

### Fixed
- Operator-style calls — functions taking a stream argument (`destructure`,
  `snakeGameLoop(difficulty)`, custom helpers like `accumulate`) — were mis-lifted
  into a per-emission `map`, producing wrong types and spurious errors. They now
  pass through untouched, so they can be written inline in `.tsrx`.

### Added
- The transform now recognises `Observable`-typed parameters, which also enables a
  library of plain stream helpers (e.g. `accumulate`, the explicit form of `scan`).

## [0.0.3]

### Changed
- Full-bleed extension icon (the gradient tile now fills the whole square) so it
  reads solidly in the Extensions list instead of looking inset.
- The built `.vsix` is now committed to the repo so it can be sideloaded straight
  from a clone.

## [0.0.2]

### Added
- Extension icon (128×128) so tsrx is easy to spot in the Extensions list.

### Fixed
- Lifted bindings showed `const x: any` (with no error) in the installed extension
  while raw types resolved. The transform located the `runtime` module relative to
  the plugin's own folder, which in the bundled extension pointed at a non-existent
  `node_modules/runtime` — so the generated `import { render } from …` was
  unresolvable and every lifted binding collapsed to `any`. The runtime is now
  located by walking up from the `.tsrx` file's own directory.

## [0.0.1]

### Added
- Initial packaged (`.vsix`) build, installable without the Extension Development Host.
- The `tsrx-ts-plugin` tsserver plugin is bundled self-contained (`@volar/typescript`
  inlined, `typescript` left to the host) so the extension ships standalone.
