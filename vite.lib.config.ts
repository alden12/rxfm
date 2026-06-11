import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Build config for the published `corrente` library.
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
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
      // Emit the declaration tree (dist/index.d.ts + dist/corrente/**) mirroring src.
      include: ['src/index.ts', 'src/corrente'],
    }),
  ],
});
