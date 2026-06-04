import { resolve } from 'path';
import { defineConfig } from 'vite';

// Build/dev config for the demo example app (src/app).
export default defineConfig({
  resolve: {
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
