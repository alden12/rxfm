import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Build config for the published `rxfm` library.
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      // Keep rxjs (and its subpaths, e.g. rxjs/operators) out of the bundle; it is a peer dependency.
      external: [/^rxjs/],
    },
  },
  plugins: [
    dts({
      // Roll the declaration tree up into a single dist/index.d.ts.
      rollupTypes: true,
      include: ['src/lib'],
    }),
  ],
});
