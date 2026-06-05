import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tsrx } from './vite-plugin-tsrx.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

// Run the tsrx demo:  npx vite --config tsrx/vite.tsrx.config.mjs
export default defineConfig({
  root: here,
  plugins: [tsrx()],
  resolve: {
    // Same alias the main demo uses, so the lib runs from source.
    alias: { rxfm: resolve(repoRoot, 'src/lib/rxfm/index.ts') },
  },
  server: { port: 3100 },
  build: { outDir: 'dist-tsrx', emptyOutDir: true },
});
