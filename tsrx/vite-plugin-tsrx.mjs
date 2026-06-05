// Vite plugin: compile .tsrx → TS (via the shared transform) → JS. Same
// `transformWithMappings` that powers the editor types and the harnesses, so what
// you run matches what you saw typed. We strip types with TypeScript's own
// transpileModule (Vite 8 is rolldown/oxc-based and doesn't ship esbuild).
import ts from 'typescript';
import { dirname } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings } = transformCjs;

export function tsrx() {
  return {
    name: 'vite-plugin-tsrx',
    enforce: 'pre', // run before Vite's own TS handling
    transform(code, id) {
      const file = id.split('?')[0]; // strip Vite's query suffix (?v=, ?import, …)
      if (!file.endsWith('.tsrx')) return null;
      const { code: tsCode } = transformWithMappings(ts, code, dirname(file));
      // Strip TS types → JS, preserving ESM imports for Vite to resolve.
      // (Sourcemap maps JS→generated-TS; mapping back to original .tsrx is a
      // later refinement — fine for running.)
      const out = ts.transpileModule(tsCode, {
        fileName: id,
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, sourceMap: true },
      });
      return { code: out.outputText, map: out.sourceMapText ? JSON.parse(out.sourceMapText) : null };
    },
  };
}
