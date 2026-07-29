// The `@reactive-ts/core/vite` entry: the `reactiveTs()` Vite plugin. It lives at
// the reactive-ts/ root (shared with the doc-site build); esbuild bundles it plus
// the transform it depends on into a self-contained dist/vite bundle.
export { reactiveTs } from "../../vite-plugin-reactive-ts";
