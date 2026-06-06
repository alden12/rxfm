import { resolve } from 'path';
import { defineConfig } from 'vite';
import { tsrx } from './tsrx/vite-plugin-tsrx.mjs';

// Build/dev config for the demo example app (examples/). The demo is authored in
// tsrx, so the tsrx plugin compiles each `.tsrx` (imperative observables → RxJS)
// before Vite's own pipeline; `.tsrx` is added to resolve.extensions so bare
// cross-file imports (`from './game'`, `from './runtime'`) resolve to `.tsrx`/`.ts`.
export default defineConfig({
  plugins: [tsrx()],
  resolve: {
    extensions: ['.tsrx', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      // Run the demo against the live library source rather than the built package.
      rxfm: resolve(__dirname, 'src/lib/rxfm/index.ts'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    // Keep the demo output separate from the published library's dist/.
    outDir: 'dist-demo',
    sourcemap: true,
  },
});
