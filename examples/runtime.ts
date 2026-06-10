// Reactive TS runtime for the examples. The transform emits `import { render } from
// "./<rel>/runtime"` and the structured examples hand-import `accumulate` /
// `interval` / `EMPTY` from here too. Both resolve to this file by walking up
// from each `.rts` to the nearest `runtime.ts` (see ts-plugin/transform.cjs).
//
// It's a thin re-export so there's a single runtime implementation: the canonical
// one lives in `reactive-ts/runtime.ts` (also used by the editor extension and the
// headless harnesses), and this shim makes it reachable from the top-level
// `examples/` tree, which is a sibling of `reactive-ts/` rather than a descendant.
export * from "../reactive-ts/runtime";
