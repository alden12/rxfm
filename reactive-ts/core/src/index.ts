// Public entry for the `@reactive-ts/core` transform. Re-exports the canonical
// `transformWithMappings` from the shared transform sources one level up in
// ../ts-plugin (the same implementation the editor tsserver plugin, the Vite
// plugin, and the headless harnesses all use). esbuild bundles the compiled
// transform in at build time, so the published package is self-contained.
export { transformWithMappings } from "../../ts-plugin/transform.cjs";
