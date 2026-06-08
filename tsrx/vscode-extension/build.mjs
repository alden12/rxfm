// Bundles the tsserver plugin (tsrx/ts-plugin) into a single
// self-contained module at node_modules/tsrx-ts-plugin/index.cjs, so the packaged
// .vsix needs nothing from the surrounding repo.
//
// tsserver loads the plugin BY MODULE NAME from the extension's node_modules (the
// `typescriptServerPlugins` contribution names it `tsrx-ts-plugin`), so the bundle
// must live there — not in dist/. `@volar/typescript` and its deps are inlined;
// `typescript` stays external because tsserver injects its own copy at runtime.
//
// In development this replaces the npm-managed `file:../ts-plugin` symlink with a
// real, dependency-free folder, so F5 and the packaged extension run identical code.
// Re-run after editing the plugin: `npm run build`.
import esbuild from 'esbuild';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rmSync, mkdirSync, writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const tsPluginDir = join(here, '..', 'ts-plugin');
const pluginEntry = join(tsPluginDir, 'index.cjs');
const outDir = join(here, 'node_modules', 'tsrx-ts-plugin');
const outFile = join(outDir, 'index.cjs');

// The transform is authored in TypeScript (transform.cts). Compile it to the
// transform.cjs that index.cjs require()s BEFORE bundling, so the .vsix can never
// ship a stale build of it (editing transform.cts then packaging is otherwise a
// silent footgun — esbuild would inline whatever transform.cjs is on disk).
execFileSync('npx', ['tsc', '-p', join(tsPluginDir, 'tsconfig.json')], { stdio: 'inherit', cwd: repoRoot });

// Drop whatever is there (a dev symlink to ../../ts-plugin, or a previous build)
// before writing the real folder. rmSync unlinks a symlink rather than following it.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [pluginEntry],
  outfile: outFile,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  // tsserver provides the matching `typescript` to the plugin factory; never bundle it.
  external: ['typescript'],
  legalComments: 'none',
});

writeFileSync(
  join(outDir, 'package.json'),
  JSON.stringify({ name: 'tsrx-ts-plugin', version: '0.0.1', main: 'index.cjs', private: true }, null, 2) + '\n',
);

console.log('Bundled tsrx-ts-plugin →', outFile);
