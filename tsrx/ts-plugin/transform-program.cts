// Building the throwaway Program the transform's inference runs against, plus
// locating the runtime module the generated code imports `render` from.
//
// Inference is checker-driven: we build a Program from the .tsrx source text and
// ask the real type checker which identifiers are observables. This module owns
// that Program (and the compiler options it uses) and the runtime-path resolution.
'use strict';
const path = require('node:path');
const fs = require('node:fs');

import type * as TS from 'typescript';
import type { Ts } from './transform-types.cjs';

// We emit a relative `render` specifier from each .tsrx file's directory so it
// resolves in both the headless harness and the editor.
//
// The runtime is located by walking up from the .tsrx file's OWN directory, not
// relative to this module — the plugin is bundled into the VS Code extension's
// node_modules, far from the source tree, so anchoring on `__dirname` emitted an
// unresolvable `../../…/node_modules/runtime` specifier and collapsed every lifted
// binding to `any` in the installed extension. `__dirname/../runtime.ts` is only a
// last-resort fallback (covers the in-repo plugin running from source).
const FALLBACK_RUNTIME_PATH = path.join(__dirname, '..', 'runtime.ts');

function findRuntimeFile(baseDir: string): string | null {
  let dir = baseDir;
  for (let i = 0; i < 16; i++) {
    const candidate = path.join(dir, 'runtime.ts');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function relativeRuntimeSpecifier(baseDir: string): string {
  const runtime = findRuntimeFile(baseDir) || FALLBACK_RUNTIME_PATH;
  let rel = path.relative(baseDir, runtime).replace(/\.ts$/, '').split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

export function getCompilerOptions(ts: Ts): TS.CompilerOptions {
  return {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  };
}

/** The transform, injected so this module needn't import the orchestrator (which
 *  imports this one) — a `.tsrx` importing another `.tsrx` re-runs it on the fly. */
type TransformFn = (ts: Ts, src: string, baseDir: string) => { code: string };

// A Program that serves `text` for `fileName` and reads everything else (libs,
// rxjs) from disk. Lets us type-check an unsaved editor buffer.
//
// Cross-.tsrx imports: a `.tsrx` file importing another `.tsrx` must see the
// imported reactive values with REAL types — lifting is checker-driven, so an
// `any` import would silently stop derivations lifting. So we resolve `./foo` to a
// sibling `foo.tsrx` (when normal resolution finds nothing) and serve it as TS,
// transformed on the fly via the injected `transform`. (No cycle handling yet;
// .tsrx import graphs are shallow.)
export function createProgramFromText(
  ts: Ts, fileName: string, text: string, options: TS.CompilerOptions, transform: TransformFn,
): TS.Program {
  const host = ts.createCompilerHost(options, true);
  const isTsrx = (f: string) => typeof f === 'string' && f.endsWith('.tsrx');
  const tsrxCache = new Map();
  const tsrxCode = (f: string) => {
    const src = fs.readFileSync(f, 'utf8');
    const hit = tsrxCache.get(f);
    if (hit && hit.src === src) return hit.code;
    const { code } = transform(ts, src, path.dirname(f));
    tsrxCache.set(f, { src, code });
    return code;
  };

  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, ...rest) => {
    if (name === fileName) return ts.createSourceFile(name, text, languageVersion, true);
    if (isTsrx(name)) return ts.createSourceFile(name, tsrxCode(name), languageVersion, true, ts.ScriptKind.TS);
    return getSourceFile(name, languageVersion, ...rest);
  };
  host.fileExists = f => (f === fileName ? true : ts.sys.fileExists(f));
  const readFile = host.readFile.bind(host);
  host.readFile = f => (f === fileName ? text : isTsrx(f) ? tsrxCode(f) : readFile(f));

  const resolve = (name: string, containingFile: string) => {
    const standard = ts.resolveModuleName(name, containingFile, options, host).resolvedModule;
    if (standard) return standard;
    if (name.startsWith('.')) {
      const candidate = path.resolve(path.dirname(containingFile), `${name}.tsrx`);
      if (ts.sys.fileExists(candidate)) return { resolvedFileName: candidate, extension: ts.Extension.Ts };
    }
    return undefined;
  };
  if ((ts as any).resolveModuleNameLiterals) {
    host.resolveModuleNameLiterals = (literals, containingFile) =>
      literals.map(lit => ({ resolvedModule: resolve(lit.text, containingFile) }));
  } else {
    (host as any).resolveModuleNames = (names: string[], containingFile: string) => names.map((n: string) => resolve(n, containingFile));
  }
  return ts.createProgram([fileName], options, host);
}
