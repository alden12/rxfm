import { resolve } from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { reactiveTs } from './reactive-ts/vite-plugin-reactive-ts';

// Build/dev config for the demo doc-site (site/). The demo is authored in
// Reactive TS, so the reactiveTs plugin compiles each `.rts` (imperative observables → RxJS)
// before Vite's own pipeline; `.rts` is added to resolve.extensions so bare
// cross-file imports (`from './game'`, `from './runtime'`) resolve to `.rts`/`.ts`.
export default defineConfig({
  plugins: [reactiveTs(), tailwindcss()],
  resolve: {
    extensions: ['.rts', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      // Run the demo against the live library source rather than the built package.
      corrente: resolve(__dirname, 'src/corrente/index.ts'),
    },
  },
  // Pre-bundle the demo's third-party deps up front so the dev server doesn't discover
  // them mid-load and trigger a re-optimize + full-page reload (the main cause of a slow
  // cold load locally). `corrente` is deliberately left out — it's aliased to live source.
  optimizeDeps: {
    include: ['rxjs', 'marked', 'highlight.js/lib/core'],
  },
  server: {
    port: 3001,
  },
  build: {
    // Keep the demo output separate from the published library's dist/.
    outDir: 'dist-demo',
    sourcemap: true,
  },
});
