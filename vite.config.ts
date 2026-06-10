import { resolve } from "path";
import { defineConfig } from "vite";
import { reactiveTs } from "./reactive-ts/vite-plugin-reactive-ts";

// Build/dev config for the demo example app (examples/). The demo is authored in
// Reactive TS, so the reactiveTs plugin compiles each `.rts` (imperative observables → RxJS)
// before Vite's own pipeline; `.rts` is added to resolve.extensions so bare
// cross-file imports (`from './game'`, `from './runtime'`) resolve to `.rts`/`.ts`.
export default defineConfig({
  plugins: [reactiveTs()],
  resolve: {
    extensions: [".rts", ".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
    alias: {
      // Run the demo against the live library source rather than the built package.
      rxfm: resolve(__dirname, "src/lib/rxfm/index.ts"),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    // Keep the demo output separate from the published library's dist/.
    outDir: "dist-demo",
    sourcemap: true,
  },
});
