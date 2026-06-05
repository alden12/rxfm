# tsrx — roadmap & next steps

Notes on where the tsrx experiment is and what comes next. tsrx is an experimental
TypeScript transform that "lifts" imperative expressions into reactive RxJS
`Observable`s, so you can write `const x = y + z` over observables and have it Just Work.

## Where it is today

Three layers are built:

- **The transform** — [ts-plugin/transform.cjs](ts-plugin/transform.cjs): source `.tsrx` → real
  RxJS `.ts` + position mappings, plus boundary diagnostics
  ([ts-plugin/boundary-diagnostics.cjs](ts-plugin/boundary-diagnostics.cjs)).
- **The editor path** — a Volar `LanguagePlugin` ([ts-plugin/language-plugin.cjs](ts-plugin/language-plugin.cjs))
  wrapped as a tsserver plugin ([ts-plugin/index.cjs](ts-plugin/index.cjs)), giving live hover /
  errors / go-to-def on `.tsrx` files mapped back to source. It rides VS Code's **real** tsserver
  project, so it already resolves the user's own `rxfm` / `rxjs`.
- **The build path** — [vite-plugin-tsrx.mjs](vite-plugin-tsrx.mjs) + [runtime.ts](runtime.ts).
- **The extension scaffold** — [vscode-extension/](vscode-extension/): contributes the `.tsrx`
  language, a (copied) TS grammar, and registers the tsserver plugin. Currently **F5-only** (runs in
  the Extension Development Host).

### Key architectural fact

The transform is **checker-driven** ([transform.cjs:96-97](ts-plugin/transform.cjs#L96-L97)): it
builds a real TS `Program` and asks the type checker whether each expression touches an observable
before deciding to lift it. A purely syntactic transform (esbuild/babel-style, no type info) **cannot**
reproduce this. This shapes most of the build-time decisions below.

The "the `.tsrx` file must live inside this repo" caveat in the extension README is only about the
headless `tsrx.mjs` demo's throwaway `Program` — **not** the editor path, which uses the real project.

---

## A. Ship a real installable extension (no dev host) — ✅ DONE (sideload)

Implemented: `cd vscode-extension && npm install && npm run package` produces
`tsrx-vscode-<version>.vsix`, installable via `code --install-extension …` or "Install from VSIX".
The `tsrx-ts-plugin` tsserver plugin is bundled self-contained with esbuild ([build.mjs](vscode-extension/build.mjs)) —
`@volar/typescript` inlined, `typescript` left external for the host — into
`node_modules/tsrx-ts-plugin/` (where tsserver resolves it by name). `vsce package` ships only that
folder from `node_modules` (see [.vscodeignore](vscode-extension/.vscodeignore); note `--no-dependencies`
drops *all* `node_modules`, so it is **not** used). Remaining if we ever want the Marketplace: a
publisher + PAT, a 128×128 PNG icon, Open VSX for Cursor/VSCodium.

Original notes — the gap that was closed:

1. **Package to a `.vsix`.** Add `@vscode/vsce` + a `package` script; `vsce package` produces a
   `.vsix` installable via `code --install-extension …` or the Extensions view "Install from VSIX".
   This alone removes the dev-host requirement.
2. **Make it self-contained (the real work).** Two blockers:
   - `"tsrx-ts-plugin": "file:../ts-plugin"` ([vscode-extension/package.json](vscode-extension/package.json))
     points *outside* the extension folder — `vsce` won't follow it.
   - The tsserver plugin is resolved **by module name** from the extension's `node_modules` and pulls
     in `@volar/typescript`.
   - **Fix:** an esbuild step that bundles the plugin (+ `@volar/typescript`) into a single
     `dist/plugin.cjs` and the activation shim into `dist/extension.cjs`, vendored inside the
     extension so `typescriptServerPlugins.name` resolves locally. (Alternatively publish
     `tsrx-ts-plugin` to npm — but bundling is simpler for now.)
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
   TS transformer path so `tsc` itself drives it (and `tsc --noEmit` typechecks `.tsrx` in CI),
   and/or (b) cache / incrementalise the `Program`. **Biggest open architectural question — decide
   before broadening the transform.**
2. **Promote the test harness.** The ad-hoc `*.mjs` scripts (`boundary.mjs`, `members.mjs`,
   `tagged-templates.mjs`, `arrays.mjs`) → a real Jest suite with fixtures: input `.tsrx` → expected
   output `.ts` + expected diagnostics + expected hover types. Lock this down **before** widening the
   transform.
3. **Broaden what lifts.** Today only `+ - * /` lift. Add comparisons, logical / ternary, more
   method-chain cases, assignments, eventually control flow. Each needs a clear "lifts vs. hits the
   boundary" rule and a fixture.
4. **Source maps in build output**, so debugging `.tsrx` in the browser maps back to source. (Editor
   mappings already exist; confirm the Vite plugin emits source maps on the emit path.)
5. **Decide tsrx's relationship to rxfm.** The new fluent API removed one original motivation (events
   no longer need the boundary). Be explicit about what tsrx still buys over fluent rxfm — mainly
   arithmetic / derived-value ergonomics — and whether `runtime.ts` should fold into rxfm core or
   stay a separate published package.
6. **Editor polish.** tsrx-specific syntax highlighting (currently a copied TS grammar); verify
   cross-file go-to-def / rename work through the Volar mappings.

### Suggested order

Packaging (A) first — living in `.tsrx` daily is the best way to find what's missing — then B2
(fixtures), then B1 (the build-type decision).
