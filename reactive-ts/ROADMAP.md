# Reactive TS — roadmap & next steps

Notes on where the Reactive TS experiment is and what comes next. Reactive TS is an experimental
TypeScript transform that "lifts" imperative expressions into reactive RxJS
`Observable`s, so you can write `const x = y + z` over observables and have it Just Work.

## Where it is today

Three layers are built:

- **The transform** — [ts-plugin/transform.cjs](ts-plugin/transform.cjs): source `.rts` → real
  RxJS `.ts` + position mappings, plus boundary diagnostics
  ([ts-plugin/boundary-diagnostics.cjs](ts-plugin/boundary-diagnostics.cjs)).
- **The editor path** — a Volar `LanguagePlugin` ([ts-plugin/language-plugin.cjs](ts-plugin/language-plugin.cjs))
  wrapped as a tsserver plugin ([ts-plugin/index.cjs](ts-plugin/index.cjs)), giving live hover /
  errors / go-to-def on `.rts` files mapped back to source. It rides VS Code's **real** tsserver
  project, so it already resolves the user's own `rxfm` / `rxjs`.
- **The build path** — [vite-plugin-reactive-ts.ts](vite-plugin-reactive-ts.ts) + [runtime.ts](runtime.ts).
- **The extension scaffold** — [vscode-extension/](vscode-extension/): contributes the `.rts`
  language, a (copied) TS grammar, and registers the tsserver plugin. Currently **F5-only** (runs in
  the Extension Development Host).

### Key architectural fact

The transform is **checker-driven** ([transform.cjs:96-97](ts-plugin/transform.cjs#L96-L97)): it
builds a real TS `Program` and asks the type checker whether each expression touches an observable
before deciding to lift it. A purely syntactic transform (esbuild/babel-style, no type info) **cannot**
reproduce this. This shapes most of the build-time decisions below.

The "the `.rts` file must live inside this repo" caveat in the extension README is only about the
headless `reactive-ts.mjs` demo's throwaway `Program` — **not** the editor path, which uses the real project.

---

## A. Ship a real installable extension (no dev host) — ✅ DONE (sideload)

Implemented: `cd vscode-extension && npm install && npm run package` produces
`reactive-ts-vscode-<version>.vsix`, installable via `code --install-extension …` or "Install from VSIX".
The `reactive-ts-plugin` tsserver plugin is bundled self-contained with esbuild ([build.mjs](vscode-extension/build.mjs)) —
`@volar/typescript` inlined, `typescript` left external for the host — into
`node_modules/reactive-ts-plugin/` (where tsserver resolves it by name). `vsce package` ships only that
folder from `node_modules` (see [.vscodeignore](vscode-extension/.vscodeignore); note `--no-dependencies`
drops *all* `node_modules`, so it is **not** used). Remaining if we ever want the Marketplace: a
publisher + PAT, a 128×128 PNG icon, Open VSX for Cursor/VSCodium.

Original notes — the gap that was closed:

1. **Package to a `.vsix`.** Add `@vscode/vsce` + a `package` script; `vsce package` produces a
   `.vsix` installable via `code --install-extension …` or the Extensions view "Install from VSIX".
   This alone removes the dev-host requirement.
2. **Make it self-contained (the real work).** Two blockers:
   - `"reactive-ts-plugin": "file:../ts-plugin"` ([vscode-extension/package.json](vscode-extension/package.json))
     points *outside* the extension folder — `vsce` won't follow it.
   - The tsserver plugin is resolved **by module name** from the extension's `node_modules` and pulls
     in `@volar/typescript`.
   - **Fix:** an esbuild step that bundles the plugin (+ `@volar/typescript`) into a single
     `dist/plugin.cjs` and the activation shim into `dist/extension.cjs`, vendored inside the
     extension so `typescriptServerPlugins.name` resolves locally. (Alternatively publish
     `reactive-ts-plugin` to npm — but bundling is simpler for now.)
3. **Add packaging metadata.** `vsce` requires: `publisher`, real `version`, `repository`, `license`,
   a 128×128 `icon`, README/CHANGELOG. Most are currently missing.
4. **Pick a distribution channel:**
   - **Sideload `.vsix`** — no account; good for now + early users.
   - **VS Code Marketplace** — needs an Azure DevOps publisher + PAT.
   - **Open VSX** — needed for Cursor / VSCodium.

Estimated ~half a day of packaging plumbing; no new framework logic.

---

## B. Substantive roadmap (priority order)

1. **Solve the build-time type problem.** Because lifting is checker-driven, the build needs full
   type info — a pure syntactic transform can't reproduce it. Options: (a) a `ts-patch` / custom
   TS transformer path so `tsc` itself drives it (and `tsc --noEmit` typechecks `.rts` in CI),
   and/or (b) cache / incrementalise the `Program`. **Biggest open architectural question — decide
   before broadening the transform.**
2. **Promote the test harness.** The ad-hoc `*.mjs` scripts (`boundary.mjs`, `members.mjs`,
   `tagged-templates.mjs`, `arrays.mjs`) → a real Jest suite with fixtures: input `.rts` → expected
   output `.ts` + expected diagnostics + expected hover types. Lock this down **before** widening the
   transform.
3. **Broaden what lifts.** Arithmetic, comparison, logical / ternary, unary, member / index /
   method access, template literals and array `.map` already lift (`.map` over a stream whose cb
   returns a component → `mapToComponents`; `.flatMap` does the same but flattens the source one
   level first, so a 2-D grid maps each leaf cell with its flat index). Next: more method-chain cases,
   assignments, eventually control flow. Each needs a clear "lifts vs. hits the boundary" rule and
   a fixture — guided by the design principle in **section C**, which also covers the next two
   concrete additions (`? : EMPTY` filter, the `accumulate` helper) and the transform fix that
   unblocks them.
4. **Source maps in build output**, so debugging `.rts` in the browser maps back to source. (Editor
   mappings already exist; confirm the Vite plugin emits source maps on the emit path.)
5. **Decide Reactive TS's relationship to rxfm.** The new fluent API removed one original motivation (events
   no longer need the boundary). Be explicit about what Reactive TS still buys over fluent rxfm — mainly
   arithmetic / derived-value ergonomics — and whether `runtime.ts` should fold into rxfm core or
   stay a separate published package.
6. **Editor polish.** Reactive TS-specific syntax highlighting (currently a copied TS grammar); verify
   cross-file go-to-def / rename work through the Volar mappings.
7. **Runtime-import distribution (needed before Reactive TS merges).** The transform auto-emits the
   `render` import via a walk-up to the nearest `runtime.ts`, but the helpers Reactive TS leaves for you to
   call by hand — `accumulate`, `interval`, `EMPTY` — are imported with **brittle relative paths**
   (`from '../runtime'`). Relocating the examples to the top-level `examples/` exposed this: every
   such path had to be hand-edited, and a `examples/runtime.ts` re-export shim was added so the tree
   (a sibling of `reactive-ts/`) could resolve the canonical `reactive-ts/runtime.ts`. Decide a durable story —
   auto-inject these the way `render` is, resolve a stable bare specifier (e.g. `reactive-ts/runtime`), or
   fold the runtime into a published package — so users don't write fragile `../../runtime` paths.
   (Ties into item 5: where `runtime.ts` ultimately lives.)

### Suggested order

Packaging (A) first — living in `.rts` daily is the best way to find what's missing — then B2
(fixtures), then B1 (the build-type decision).

---

## C. Making reactivity accessible (decided design)

**The north star:** make observable / reactive programming approachable for people coming from an
imperative or functional background. Reactive code trips newcomers up mostly on the *time*
dimension — a variable isn't one value, it's a value over time, sometimes absent, sometimes
carrying state. Reactive TS's job is to let the easy part read like ordinary code, and to make the genuinely
time-shaped part *legible* rather than hidden behind operator jargon.

### Guiding principle (the "lifts vs. explicit" rule)

> **Lift the *total* operations silently** — `map`, `combineLatest`, `switchMap` behave like normal
> values (they always emit), so `count * 2`, `a === b`, `cond ? x : y` should just work and read as
> plain code.
>
> **Don't hide the operations that are *partial* (filter), *stateful* (scan), or *time-based*
> (debounce / throttle).** Require a familiar, explicit construct that makes the time-dimension
> visible — using a primitive the newcomer already owns (if/else, fold, Redux-style reducer).

The split *is* the curriculum: the silent stuff is "just variables," and every explicit construct is
a deliberate teaching moment about how time works. This gives B3 its concrete rule.

### C1. `filter` → ternary with `EMPTY` — ✅ DONE

Express filtering as the if/else newcomers already know, with an explicit "nothing here" branch:

```ts
score > 10 ? score : EMPTY   // partial — drops the emission when false (this is filter)
score > 10 ? 'big' : EMPTY   // filter + map in one
score > 10 ? score : 0       // TOTAL — always emits (the safe default, one keystroke away)
```

This needs **no transform change** — `EMPTY` flows straight through the existing ternary →
`switchMap` lowering (`(score > 10).pipe(switchMap(c => c ? score : EMPTY))`). Why it's the right
shape: `.filter(p)` *hides* that a stream can be value-less in time; `? : EMPTY` *shows* it, and the
partial vs. total forms sit side-by-side on the same syntax — the language itself teaches "if you
don't give an else-value, downstream waits."

- **Done:** `EMPTY` is re-exported from the runtime (single import); the transform flags a binding
  produced by `? : EMPTY` as maybe-empty.
- **Stall guardrail (done):** when a maybe-empty binding feeds a `combineLatest` (e.g. `big + 1`), the
  transform records the span and the tsserver plugin surfaces a **warning** there — "this can be
  empty; the combine waits until it first emits." Standalone use (as a child) is fine and not warned.
  Verified headlessly by `empty-filter.mjs` (detection + the plugin's `stallDiagnostics`).

### C2. Recognise `Observable`-typed parameters — don't mis-lift operator-style functions — ✅ DONE

**The linchpin fix.** A function whose parameter is typed `Observable<…>` is meant to *receive the
stream*, not be mapped over its emissions. Today Reactive TS mis-lifts these:

```ts
accumulate(score, (hi, s) => Math.max(hi, s), 0)
// → combineLatest([score, of(fn), of(0)]).pipe(map(([score, fn, seed]) => accumulate(score, fn, seed)))   ← broken
```

This is the same mis-lift that hit `snakeGameLoop(difficulty)` and `destructure(...)` in the snake
example. **Fix:** when the callee's parameter type is `Observable<…>`, pass the stream argument
through unlifted. One change that pays off twice:

- it lets operator-style calls (`destructure`, custom loops, `snakeGameLoop`) be written directly in
  `.rts`, and
- it unblocks an entire *library* of plain typed stream helpers with **no per-operator transform
  code** — they're just functions (see C3).

### C3. `scan` → an `accumulate` runtime helper — ✅ DONE

Once C2 lands, scan needs no transform magic — just a typed helper:

```ts
function accumulate<T, A>(source: Observable<T>, reducer: (acc: A, value: T) => A, seed: A): RenderObservable<A>;

const highScore = accumulate(score, (hi, s) => Math.max(hi, s), 0);  // running max, emitted each tick
```

**Name decision: `accumulate`** (single primitive — no aliases, to keep the docs explaining one
way). Rationale:

- It's a **verb naming the operation** and reads correctly at the call site; legible to someone who
  knows neither Redux nor Haskell (the actual hard audience).
- It's **honest about the running, non-terminal semantics** — scan emits the accumulation on every
  arrival. `reduce` / `fold` connote collapsing to a single terminal value (and on a non-completing
  UI stream, RxJS `reduce` would emit *never*); "accumulate" keeps reduce's familiar
  `(acc, value) => acc` + seed shape without that terminal lie.
- Rejected alternatives: **`reducer`** — grammatically backwards (in Redux the *reducer* is the
  callback you pass; the helper is `useReducer`), and it implies a `dispatch` that isn't there.
  **`withPrevious`** — a genuinely *different*, narrower operation (pairwise `(prev, curr)`, where
  "prev" is the previous *input*, not a fed-back accumulator) — it can't express a running max, so
  it's not a candidate for the core primitive. **`scan` / `fold`** — only the FP crowd knows them;
  they fail the imperative/React audience that actually gets confused.
- **Deferred:** if a real need for the pairwise shortcut appears, add `withPrevious` later as a
  clearly *distinct* helper (not an alias) — so the docs still only ever explain one way to do the
  general thing.

### C4. Collapse chained member access into one `map` — ✅ DONE

Today a chained member access on a stream lifts one hop at a time:

```ts
state.trail.coordinates
// → state.pipe(map(state => state.trail)).pipe(map(_o => _o.coordinates))
```

Correct, but it threads two `map`s (and, via `render`, two `distinctUntilChanged`s) where one would
do. The transform should fold a contiguous member/index chain rooted in a single stream into a single
`map`:

```ts
// → state.pipe(map(state => state.trail.coordinates))
```

Pure optimization — same semantics, less generated code and fewer intermediate operators. Surfaced
by the full Reactive TS snake game (`getBoard(state.trail.coordinates, state.food)`).

### C5. `interval` — a clock with a reactive period — ✅ DONE

A runtime helper that hides the one irreducible operator (the stream-of-streams switch):

```ts
function interval(period: number | Observable<number>): Observable<number>;
// = periods.pipe(distinctUntilChanged(), switchMap(ms => timer(0, ms)))

const period = periodFor(difficulty);  // RenderObservable<number>
const tick = interval(period);         // restarts the clock when difficulty changes
```

Emits `0, 1, 2, …` immediately then every `period` ms (a strict superset of RxJS `interval`, with an
immediate first tick). With an `Observable<number>` it switches to a fresh timer whenever the period
changes — so the snake's difficulty-driven speed works with **no explicit `switchMap`** in the view.
This is the section-C principle applied to a time-based operator: no imperative analogue exists, so
give it a friendly explicit name rather than an inline incantation.

### C6. Recursively lift arguments of pass-through (operator-style) calls — ✅ DONE

When C2 leaves an operator-style call in place, it now re-emits the call with each argument's
*transformed* pieces, so a liftable **argument** still lifts:

```ts
interval(periodFor(difficulty))
// → interval(combineLatest([difficulty]).pipe(map(([difficulty]) => periodFor(difficulty))))
```

The call itself isn't render-wrapped (the callee may return a non-observable, e.g. `destructure`'s
object) — only its arguments are rewritten, signalled by a `rewritten` result flag applied at the
binding / tagged-template sites. Pieces compose, so nested operator-style calls work too.
`destructure(...)`, `accumulate(score, fn, seed)`, etc. are unaffected (their args don't lift).

### C7. Lift element access over a static object with an observable index — ✅ DONE

Element access already lifted when the *object* was a stream; now it also lifts when the object is
static and the **index** is a stream:

```ts
CELL_COLOR_MAP[cell]
// → cell.pipe(map(cell => CELL_COLOR_MAP[cell]))
```

Drives off the index (single source, no combineLatest); the object expression is re-referenced inside
the map (free for the common case — a constant lookup table named by identifier). Removes the
lookup-helper boilerplate (`cellColor`, `periodFor`) the snake needed as a workaround:
`CELL_COLOR_MAP[cell]` and `interval(DIFFICULTY_TICK_PERIOD_MAP[difficulty])` now Just Work (the
latter composing with C6).

### Suggested order for C

**C1 ✅** (filter idiom + stall warning) · **C2 ✅** (operator-style mis-lift fix) · **C3 ✅**
(`accumulate`) · **C4 ✅** (chained-member collapse) · **C5 ✅** (`interval`) · **C6 ✅** (recursive
arg lifting) · **C7 ✅** (element-access by stream index). All of section C is shipped.

### Status

- **C2 ✅ / C3 ✅** — shipped (`tsrx: don't mis-lift operator-style calls; add accumulate helper`).
- **RenderObservable is now distinct-by-reference** — a `distinctUntilChanged()` was added before the
  `shareReplay`, so deriving from an unchanged value is a no-op (React-like; the DOM isn't touched
  needlessly).
- **C5 ✅** — `interval(period)` runtime helper (reactive-period clock).
- **Demonstrated by the full Reactive TS snake game:** with C2/C3/C5 + the imperative analogues
  (`accumulate` for scan, reading `.value` for withLatestFrom, return-`null`-then-reset for retry,
  `interval` for the difficulty-driven clock), the whole game reduces to **pure domain logic + an
  event source**, with no explicit RxJS operators in the view. The lone irreducible shape —
  stream-of-streams switch (build a fresh timer per difficulty, switch to it), which lifting can't
  express because lifts only produce values — is now tucked inside `interval`.
- **C6 ✅** — pass-through (operator-style) calls now recursively lift their arguments, so the inline
  `interval(periodFor(difficulty))` works (no need to lift at a separate binding first).
- **C7 ✅** — element access over a static object with a stream index lifts; the snake game dropped
  its `cellColor` / `periodFor` lookup helpers and indexes the lookup tables directly.
- **Reactive TS works outside rxfm** (the reactive engine `examples/snake-game/game.rts` has ZERO rxfm
  imports — `accumulate` + `interval` + derived lifts — and type-checks on its own). Reactive TS is just
  RxJS + the tiny runtime; the pure game rules stay pure (no observables to lift). So the natural
  decomposition is: **reactive glue → Reactive TS; pure algorithms → plain functions.** For tightly-coupled
  state (snake trail + food + score co-evolve) the reactive unit is a single combined `accumulate` —
  that's the problem's structure, not a Reactive TS limit; splitting into per-field streams would need
  feedback Subjects.
- **C1 ✅ / C4 ✅** — filter idiom + stall warning, and chained-member collapse (above).
- **Cross-`.rts` imports — transform side ✅, editor side ✅ (B1):**
  - **Transform side:** the transform's inference Program resolves a `./foo` import to a sibling
    `foo.rts`, transformed on the fly, so an imported reactive value carries its real type and
    derivations over it still *lift* — `board.flat()` on an imported `board` lifts. This is what the
    build/runtime path (Vite) needs.
  - **Editor side (now fixed, ext 0.0.9):** the tsserver/Volar path type-checks the generated virtual
    code through a *separate* resolution, and a bare `import … from './game'` reported "Cannot find
    module". Root cause (from the Volar 2.4 source, not the chicken-and-egg I first guessed): Volar's
    `decorateLanguageServiceHost` only routes a file's imports through its custom resolver — the one
    that honours `resolveHiddenExtensions` and maps `./game` → `./game.rts` — when **at least one
    import literal in that file already ends in `.rts`**. A file with only bare specifiers falls
    through to stock TS resolution, which has no `.rts` knowledge → unresolved. So
    `resolveHiddenExtensions` was necessary but dead for the common case.
  - **The fix:** the plugin (`ts-plugin/index.cjs`) layers a fallback over the host's
    `resolveModuleNameLiterals`/`resolveModuleNames` after Volar decorates it: any *leftover*
    unresolved relative import whose sibling `<spec>.rts` (or `<spec>/index.rts`) exists on disk is
    resolved to that file, served as `.ts` (Volar's `getServiceScript` maps the virtual code to TS).
    Proven headlessly two ways: `editor-resolution.mjs` (the shipped resolver makes `./producer`
    resolve and `seconds * 2` cross-types to `RenderObservable<number>`) and `snake-split.mjs` (the
    split snake's full output type-checks under the editor's real tsconfig, `board` imported as
    `RenderObservable<SnakeBoard>`). **A reactive "engine" module and its view can now live in
    separate `.rts` files** — the snake is split into `game.rts` (engine) + `snake-game.rts` (view).
- **Pending (substantive roadmap):** declaration emit / incremental Program for a fast `tsc` build,
  `.rts` import cycle handling, then B2 (fixtures) and the rest of section B.

## D. Pain points surfaced by the Minesweeper conversion

Converting the Minesweeper example (`examples/minesweeper/`) was a deliberate stress test — a
component-heavy app with per-cell event handlers and reactive timers. It type-checks end-to-end, but
only after working around three real rough edges. Each is a place where the "treat streams as
variables" illusion leaks. **Tackle order: D1, then D2, then D3.**

### D1. Lifting only happens at `const` bindings — not in object literals or call arguments — ✅ DONE

The transform lifts an expression when it's a variable initializer, a tagged-template `${…}` slot,
or a `mapToComponents` callback. It does **not** lift an observable expression sitting directly
inside an object literal or a call argument. So this fails (member access not lifted):

```ts
Div.style({ backgroundColor: cell.color })   // cell.color stays a stream-member access → error
```

and you must name the value first:

```ts
const backgroundColor = cell.color;           // lifts here
Div.style({ backgroundColor })
```

Same for conditional children: `Div(gameStage === 'win' ? Win : EMPTY)` doesn't lift; binding it to
`const message = …` first does. This is partly *on-philosophy* — naming streams is the whole pitch —
but it's a sharp, surprising edge when a value works in one position and not another.

- **Related:** destructuring a stream into its fields (`const { board, gameStage } = game;`) should
  lift each field like the member-access form does (noted as a TODO in `game.rts`). Same root: the
  binding *target* shape, not just simple identifiers, needs lifting support.
- **Done:** lifting now also happens at object-literal property values, call arguments (children,
  `.class(…)` flags, …), and object-binding-pattern destructuring of an observable identifier. Only
  `lifted` (observable-involving) expressions are touched, so constants are untouched and C6's
  operator-style arg lifting / component-`.map` list rendering are unaffected. Minesweeper drops all
  its forced intermediate bindings. Covered by `d1.mjs`.
- **Related finding — `EMPTY` vs `null` in a child slot:** `cond ? Div`…` : EMPTY` as a *child*
  doesn't hide the element when the condition flips false — `EMPTY` emits nothing, so rxfm's children
  operator never gets a signal to remove the previous element (it lingers, e.g. a stale "You Win!").
  Use `: null` for conditional children (rxfm treats `null` as "clear this child"); reserve `EMPTY`
  for value streams feeding `accumulate`/filters where you genuinely want no emission. The C1 idiom
  text should call this out. (Minesweeper now uses `null` for its conditional messages.)

### D2. A stream can't be captured inside an event-handler closure — ✅ DONE

A handler is an ordinary closure that runs *later*, so a stream referenced inside it is the stream,
not its current value:

```ts
// index is Observable<number> from mapToComponents — this can't work:
.onClick(() => dispatch({ type: 'discover', cell: indexToVector(index) }))
```

The original used `index.pipe(map(i => () => dispatch(...)))` — a *stream of handlers*. Reactive TS has no
way to express that imperatively yet. Minesweeper sidesteps it with a fixed grid keyed by static
`[x, y]` coordinates, so handlers capture plain numbers — clean, but it forced the whole
board-rendering shape.

- **Done:** a handler argument in a parameter that accepts an `Observable` (rxfm's `EventHandler` is
  `handler | Observable<handler>`) is lifted to a stream of handlers —
  `stream.pipe(map(v => () => …v…))`, `combineLatest([…])` for several captures — with the body left
  verbatim. A capture counts only when the stream is read as a *value*; streams touched via their API
  (`subject.next(…)`, `.value`, `.pipe`) are left alone, so push-into-Subject handlers still work.
  Covered by `d2.mjs`; the Minesweeper board uses the natural
  `board.flat().map((cell, index) => …)` form again.

### D3. Lifting drops TypeScript's control-flow narrowing — ✅ DONE (single-observable case)

`startTime` is `number | undefined`. In source, a guard narrows it; after lifting, the guarded use is
relocated into a separate `combineLatest(...).pipe(map(...))`, losing the narrowing:

```ts
startTime === undefined ? 0 : Math.round((endTime - startTime) / 1000)
//                                          ^^^^^^^ now possibly-undefined again → error
```

Minesweeper moves the arithmetic into a pure `duration` getter on the game (where ordinary narrowing
works) and lifts that. Acceptable, but it pushes logic out of the reactive layer just to satisfy the
checker.

- **Done (single-observable case):** when every observable in a ternary roots in one identifier `x`
  (so no branch is itself a stream), it's lifted as `x.pipe(map(x => <verbatim ternary>))` — the
  condition and branches run as plain code with `x` a value, so narrowing works as usual:
  `x === undefined ? 0 : x + 1`, `cell.symbol ? '12px' : '14px'`. These also collapse to one `map`
  rather than `switchMap`. Covered by `d3.mjs`.
- **Still open (multi-observable guards):** a guard over two independent maybe-undefined streams
  (e.g. `startTime`/`endTime`) can't narrow both after lifting — the lazy `switchMap` form computes
  the condition separately, and a single `combineLatest`+plain-ternary would lose `switchMap`'s
  laziness (and could stall on a maybe-empty un-taken branch). Recommendation stays: do the
  undefined-handling in a pure helper (Minesweeper's `duration` getter) and lift the result.

### D4. A component-`.map` item param can't be destructured — ✅ DONE

The cell item of `board.flat().map((cell, index) => …)` is a stream, so reading a field means
`cell.color`, `cell.symbol`, … everywhere. The natural JS shorthand — destructuring the param —
didn't work, because `mapToComponents` hands the callback an `Observable<Cell>`, not a `Cell`, so
`({ color }) => …` would try to pull `color` off the Observable:

```ts
board.flat().map(({ color, symbol }, index) => …)   // color/symbol off Observable<Cell> → error
```

- **Done:** a plain object-binding-pattern item param is renamed to a synthetic stream identifier
  (`item`) and each field becomes an *alias* that lifts to `item.field` wherever it's read — as a
  value (`color` → `item.pipe(map(item => item.color))`), an element-access index
  (`COLORS[neighbors]`), a ternary, or captured in a handler. Crucially, fields of one item share
  that param, so a multi-field expression collapses to a **single** map
  (`isCleared && hasNeighbors ? neighbors : symbol` → one `map` over `item`) — identical output to
  the `cell.` form, narrowing preserved. Only simple-field patterns qualify (no rest, defaults,
  computed names, or nesting); anything else falls back to the plain-identifier param. Covered by
  `d4.mjs`; the Minesweeper board now destructures its cell.
- **Extension ✅ — destructure an `Observable<T>` param of a *standalone* function.** Pulling a
  component out into a named function (`const TodoItem = ({ name, done }: Observable<TodoItem>) => …`)
  hit the same wall, but off the `.map` path. The same rebind now fires for any arrow / function /
  method whose parameter is a plain object-binding pattern **explicitly annotated `Observable<T>`** —
  the pattern is rebound to a synthetic `item` (the `: Observable<T>` annotation is preserved, so the
  function's signature and callers are unaffected) and the fields lift in the body just as the map
  item does. Gated on the explicit annotation because, unlike a map callback (where the item is
  contextually a stream), a named function can be called from anywhere — without the annotation the
  destructure is ordinary value-unwrapping and is left untouched. The two paths share one
  `bindDestructure` helper. Covered by the `destructured-fn-param` fixture; the todo-list example's
  `TodoItem` now uses this form. (A field-typed `Observable<T>` param passed at the call site flows
  through verbatim, so it composes with the `mapToComponents` the `.map` emits.)

### D5. Single-stream operator chains don't collapse to one map — ✅ DONE

Converting the basic examples surfaced a codegen-quality edge. D3 collapses a *ternary* whose
observables all root in one identifier to a single `map` (preserving narrowing). The binary, unary,
and logical handlers don't do the same — they eagerly `combineLatest`, even when every operand roots
in one stream. So a single-stream expression nests:

```ts
tick % 2 === 0
// → combineLatest([combineLatest([tick, of(2)]).pipe(map(([tick, _1]) => tick % _1)), of(0)])
//     .pipe(map(([_0, _1]) => _0 === _1))
```

when it could be `tick.pipe(map(tick => tick % 2 === 0))`. Same for `count * 2`
(`combineLatest([count, of(2)])` instead of one map over `count`) and `selected === option`.

- **Done:** the existing `observableRoots` single-root check (D3) was factored into a shared
  `singleRootLift` and applied at the top of the binary / unary / logical lift paths too — when all
  observables root in one identifier `x`, the expression lifts as `x.pipe(map(x => <verbatim>))` via
  `expandAliases`. Arithmetic/unary results stay marked non-callable (so the boundary teaching still
  fires); only multi-stream expressions (`a + b` over two streams) keep `combineLatest`. This unifies
  D3 into a general "single-root expressions lift as one narrowing-preserving map" rule. Covered by
  `d5.mjs`; `example.rts`'s `sum` comment updated to match.
- **Two latent `observableRoots` bugs surfaced and fixed while doing this** (D5 widened where the
  single-root check runs, so they started biting): it now (a) skips property-name identifiers — a
  name like `done` that leaked into `observableBindings` from another scope was wrongly rooted in
  `item.done`; and (b) refuses to collapse when an observable is read via a stream-API member
  (`clicks.value`, `.next`, `.pipe`) — binding `x` to the emitted value would break the call. A
  non-identifier observable (a call returning a stream) still disqualifies the collapse.
- **Note — `observableBindings` has no block scoping:** a lifted `const name = …` (or D1 destructure)
  in one function marks `name` observable for the rest of the file. D5's property-name skip removes
  the symptom that surfaced here, but the flat set is still a latent sharp edge if a bare polluted
  name is read as a value in an unrelated scope. Proper lexical scoping of `observableBindings` is a
  follow-up.

### D6. A fold's initial state must be observable on load — ✅ DONE (`accumulate` emits `null` first)

Surfaced when the example suite became the **rendered** demo (it was previously only type-checked).
`accumulate(source, reducer, seed)` lowered to RxJS `scan`, which does **not** emit until `source`
first emits. A fold driven by an immediate clock is fine (snake's `interval` ticks at t=0, so the
board shows), but Minesweeper folds a **`Subject`** of cell actions that is silent on load, so
`board` / `gameStage` never emitted and the board rendered **blank until the first click** — and
nothing in the types warned of it. The hand-written RxJS version sidesteps this with
`scan(...).startWith(getStartingState())`.

**Decision — `accumulate` emits `null` before the first source value**, so it returns
`RenderObservable<A | null>` and every consumer must handle "no result yet". The idiom is nullish
coalescing, which Reactive TS already lifts:

- `const game = accumulate(actions, reduceGame, getInitialGame()) ?? getInitialGame();` — show a
  default immediately (lowers to a `switchMap` that swaps in the fallback on `null`).
- `const best = accumulate(winTimes, Math.min, Infinity);` left as `number | null`, hidden by the
  view's `best ? … : null` guard until the first win.

This deliberately **separates the fold seed from what to show initially**: a min-reduction seeds
`Infinity` but must render nothing until a real value — a blanket "emit the seed" variant would force
`Best: Infinity` and conflate the two roles, so it was rejected. The cost is type-enforced (every
consumer handles the initial case) and a one-time migration of existing folds (snake's `state` /
`highScore` now `?? …`).

- **Caveat:** `null` is the "no result yet" sentinel, so a fold whose value can legitimately be
  `null` can't distinguish the two (and `??` would swallow a real null). Fine for game state/scores;
  a dedicated symbol sentinel would be more rigorous but loses `??` ergonomics.
- **Follow-up:** this is implemented on the docs/examples branch (runtime + snake/minesweeper). The
  same `accumulate` change + consumer migration must be applied on the Reactive TS implementation branch.
