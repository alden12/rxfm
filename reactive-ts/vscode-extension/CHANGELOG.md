# Changelog

All notable changes to the Reactive TS VS Code extension.

## [0.0.26]

### Added
- Bundled transform now flattens a lookup table of `TypeOrObservable<T>`. Indexing a
  `Record<K, TypeOrObservable<T>>` (values mixing plain numbers and streams) by an observable key
  lowers to `key.pipe(switchMap(key => coerceToObservable(MAP[key])))` rather than a plain `map`, so
  `MAP[key]` resolves to a flat `RenderObservable<T>` instead of a higher-order
  `Observable<Observable<T>>`. Lets a multi-way ternary be refactored into a dispatch table.
  `coerceToObservable` is sourced from the runtime, so generated code stays decoupled from `rxfm`.

## [0.0.25]

### Fixed
- A self-referential ternary branch (`cond ? cond : EMPTY`) no longer emits invalid code. The branch
  refers to the current value in the `switchMap` body (the param shadows the outer stream), so it's
  now re-emitted as `of(cond)` rather than bare — which had type-errored (the bare branch was a
  non-stream value, not a valid `switchMap` input). External observable branches (`cond ? other :
  EMPTY`) are unaffected — still switch-mapped to.

## [0.0.24]

### Added
- Bundled transform now destructures an observable **expression**, not just a bare identifier:
  `const { board, gameStage, duration } = accumulate(…) ?? getInitialGame()` hoists the source into
  one shared binding and fans each field off it (subscribed once), where before only
  `const { … } = game` (an identifier source) was supported.

## [0.0.23]

### Added
- Bundled transform now lifts `.flatMap` to `mapToComponents` (flatten the source one level,
  then a keyed list) — so a 2-D grid renders as a flat, keyed list of leaf components,
  `board.flatMap((cell, index) => …)`, with the flattened index. Sibling to the existing
  `.map` → `mapToComponents` lift.

## [0.0.22]

### Changed
- Recoloured the icons: the "TS" in the RTS wordmark is now violet (matching the brand
  pink→purple gradient) rather than blue, so the mark reads as its own wordmark rather than
  evoking the TypeScript logo.

## [0.0.21]

### Changed
- Shortened the display name from "Reactive TS (live types)" to just **"Reactive TS"**.
- Refreshed the `.rts` file icon (centered RTS wordmark; the language icon is a fallback that file
  icon themes can override — the default Seti theme does, so it shows in tabs/quick-open but not the
  Explorer unless a deferring icon theme is active).
- Bundled transform now lifts a destructured `Observable<T>` parameter of a standalone function
  (`({ name, done }: Observable<T>) => …`), not just a component-`.map` item param.

## [0.0.20]

### Changed
- **Renamed to Reactive TS.** The language, file extension, and tooling were rebranded off the old
  `tsrx` / `.tsrx` name (which collides with an unrelated TypeScript UI language extension). The
  source extension is now **`.rts`**, the editor language id is **`rts`**, the extension is
  `reactive-ts-vscode`, and the bundled tsserver plugin is `reactive-ts-plugin`. New `.rts` file
  icon (an **RTS** wordmark). No behavioural change to the transform, diagnostics, or hovers — only
  names. Because the extension id changed, VS Code treats this as a new extension; uninstall the old
  "TSRx (live types)" if it's still present.

## [0.0.19]

### Fixed
- **Auto-import edits now actually apply.** 0.0.18 made the suggestion/"Update import" fix appear,
  but accepting it added nothing. The transform injected its own `import { … } from "rxjs"` /
  `"rxfm"` lines into a generated-only preamble *before* the file's own imports; TypeScript merges a
  new symbol into the **first** import for a module — the injected one — and that edit lands in
  generated text Volar can't map back to the `.rts`, so it was silently dropped. The transform now
  folds the names it needs into the source's existing import for each module (a separate line only
  when the source doesn't import that module), leaving a single source-anchored import the
  auto-import can merge into and map back. Now the import line is written as in `.ts`.

## [0.0.18]

### Fixed
- **Auto-imports now work in `.rts` files.** Typing an unimported `Div` / `timer` / … and accepting
  the completion (or using "Add import") had offered nothing. TypeScript only returns module-export
  (auto-import) completions when `includeCompletionsForModuleExports` is set, and VS Code's built-in
  TypeScript extension keys that preference off the `typescript`/`javascript` language ids — so it
  never sent it for the custom `rts` language. The plugin now forces it on for `.rts` completion
  requests (merging with VS Code's other preferences), so auto-import suggestions appear and insert
  the import as in `.ts`.

## [0.0.17]

### Fixed
- Standard editing affordances now work in `.rts` files: toggle-comment (`Cmd`/`Ctrl` + `/`),
  auto-indent on Enter and paste, and wrap-selection-in-brackets/quotes (auto-surround). The `rts`
  language declared a grammar and the tsserver plugin but contributed no `language-configuration.json`,
  which is the file VS Code reads for comments, indentation rules, and surrounding pairs. Added one
  mirroring TypeScript's (`.rts` is TypeScript syntactically), so these behave as they do in `.ts`.

## [0.0.16]

### Changed
- New `.rts` file icon: a bold **RX** wordmark in the Reactive TS pink→purple gradient on a transparent
  background (replacing the gradient marble badge), so it stands out on dark and reads on light.

### Internal
- The tsserver-plugin layer and the transform are now authored in TypeScript (`.cts`), with the
  transform split into focused modules. No behaviour change — same generated output, diagnostics,
  and warnings; the bundled plugin is functionally identical.

## [0.0.15]

### Fixed
- Transform-emitted warnings now actually surface in the editor — both the higher-order-lift warning
  (0.0.14) and the older `? : EMPTY` stall warning (0.0.7). They re-ran the transform on the host's
  snapshot for the `.rts` path, which under Volar is the **generated** TS that tsserver analyses,
  not the original source — so they found none of the source-level patterns they key off and
  silently emitted nothing. They now reuse the result the language plugin already computes from the
  original source.

## [0.0.14]

### Added
- Warns on **higher-order lifts**. Lifting a call whose function itself returns an observable — e.g.
  `timer(0, period)` over an observable `period` — maps over the lifted argument and produces
  `Observable<Observable<…>>`, a stream of streams that never flattens, so it won't behave as one
  reactive value. This type-checks (TypeScript stays silent), so it was a silent footgun; it's now a
  warning that points at a `switchMap`-flattening helper (e.g. `interval(period)` for a clock whose
  rate can change). See the higher-order case in `examples/boundary.rts`.

## [0.0.13]

### Changed
- A binary, unary, or logical expression whose observables all root in **one** stream now lifts as a
  single `map` (`count * 2` → `count.pipe(map(count => count * 2))`, `tick % 2 === 0` → one map, not
  nested `combineLatest`), preserving TypeScript narrowing — the same collapse the ternary already
  did. Multi-stream expressions (`a + b` over two streams) still use `combineLatest`; a value read via
  a stream API (`subject.value`) is left alone.
- Hovering the named observable inside a collapsed expression (`count` in `count * 2`) now shows its
  declared `Observable<…>` type — mapped to the outer stream reference — matching the member-access
  lift and the variable's own declaration, instead of the in-`map` value type.

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
- A bare cross-`.rts` import (`import { x } from './engine'`) now resolves in the editor. 0.0.8's
  `resolveHiddenExtensions` was necessary but insufficient: Volar only consults it when a file
  already imports something with a literal `.rts` suffix, so a plain `./engine` specifier fell
  through to stock TS resolution (which doesn't know `.rts`) and reported "Cannot find module". The
  plugin now layers a fallback over the host's module resolution that maps any leftover unresolved
  relative import to a sibling `.rts` file (served as `.ts`). A reactive "engine" module and its
  view can now live in separate `.rts` files, and a derivation over an imported reactive value
  still lifts with its real type.

## [0.0.8]

### Changed
- Enabled Volar's `resolveHiddenExtensions` toward editor-side cross-`.rts` imports. This turned out
  to be necessary but not sufficient on its own — see 0.0.9 for the completing fix.

## [0.0.7]

### Added
- Cross-`.rts` imports resolve with real types, so a derivation over a reactive value
  imported from another `.rts` file still lifts — you can split a reactive "engine"
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
  pass through untouched, so they can be written inline in `.rts`.

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
- Extension icon (128×128) so Reactive TS is easy to spot in the Extensions list.

### Fixed
- Lifted bindings showed `const x: any` (with no error) in the installed extension
  while raw types resolved. The transform located the `runtime` module relative to
  the plugin's own folder, which in the bundled extension pointed at a non-existent
  `node_modules/runtime` — so the generated `import { render } from …` was
  unresolvable and every lifted binding collapsed to `any`. The runtime is now
  located by walking up from the `.rts` file's own directory.

## [0.0.1]

### Added
- Initial packaged (`.vsix`) build, installable without the Extension Development Host.
- The `reactive-ts-plugin` tsserver plugin is bundled self-contained (`@volar/typescript`
  inlined, `typescript` left to the host) so the extension ships standalone.
