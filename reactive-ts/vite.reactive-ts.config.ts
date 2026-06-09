import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reactiveTs } from './vite-plugin-reactive-ts';

const here = dirname(fileURLToPath(import.meta.url));
// here is reactive-ts/; the repo root (with src/lib) is one level up.
const repoRoot = resolve(here, '..');

// Run the Reactive TS demo:  yarn dev:reactive-ts  (builds the transform first, then serves).
// The plugin imports the compiled ts-plugin/transform.cjs, which is gitignored —
// `yarn build:reactive-ts` regenerates it.
export default defineConfig({
  root: here,
  plugins: [reactiveTs()],
  resolve: {
    // Same alias the main demo uses, so the lib runs from source.
    alias: { rxfm: resolve(repoRoot, 'src/lib/rxfm/index.ts') },
  },
  server: { port: 3100 },
  build: { outDir: 'dist-reactive-ts', emptyOutDir: true },
});
