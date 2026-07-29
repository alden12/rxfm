// Reactive TS runtime for the doc-site. The transform emits `import { render } from
// "./<rel>/runtime"`, resolved to this file by walking up from each `.rts` to the
// nearest `runtime.ts` (see ts-plugin/transform.cjs). Hand-written helpers
// (`accumulate` / `interval` / …) are imported from `corrente` directly now that the
// runtime sits on the package's public surface — this shim exists only for the
// transform-emitted `render`.
//
// It's a thin re-export so there's a single runtime implementation: the canonical
// one lives in `reactive-ts/runtime.ts` (also used by the editor extension and the
// headless harnesses), and this shim makes it reachable from the top-level
// `site/` tree, which is a sibling of `reactive-ts/` rather than a descendant.
export * from '../reactive-ts/runtime';
