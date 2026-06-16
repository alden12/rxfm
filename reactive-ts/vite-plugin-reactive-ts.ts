// Vite plugin: compile .rts → TS (via the shared transform) → JS. Same
// `transformWithMappings` that powers the editor types and the harnesses, so what
// you run matches what you saw typed. We strip types with TypeScript's own
// transpileModule (Vite 8 is rolldown/oxc-based and doesn't ship esbuild).
import ts from 'typescript';
import { dirname } from 'node:path';
import type { Plugin } from 'vite';
import { transformWithMappings } from './ts-plugin/transform.cjs';

export function reactiveTs(): Plugin {
  return {
    name: 'vite-plugin-reactive-ts',
    enforce: 'pre', // run before Vite's own TS handling
    transform(code: string, id: string) {
      const [file, query = ''] = id.split('?'); // strip Vite's query suffix (?v=, ?import, …)
      if (!file.endsWith('.rts')) return null;
      // `?raw`/`?url`/`?inline` imports are handled by Vite core (it returns the file
      // as a string / URL); by then `code` is the JS wrapper, not `.rts` source, so
      // skip them — this is what lets the demo import a `.rts` example's own source to
      // display next to its live output.
      if (/(^|&)(raw|url|inline)(&|$)/.test(query)) return null;
      const { code: tsCode } = transformWithMappings(ts, code, dirname(file));
      // Strip TS types → JS, preserving ESM imports for Vite to resolve.
      // (Sourcemap maps JS→generated-TS; mapping back to original .rts is a
      // later refinement — fine for running.)
      const out = ts.transpileModule(tsCode, {
        fileName: id,
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, sourceMap: true },
      });
      return { code: out.outputText, map: out.sourceMapText ? JSON.parse(out.sourceMapText) : null };
    },
  };
}
