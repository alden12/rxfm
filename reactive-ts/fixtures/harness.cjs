// Shared fixture harness for the Reactive TS transform (CommonJS so Jest runs it with no
// ESM/ts-jest machinery — the transform is already CJS).
//
// Every legacy *.mjs script repeated the same ~30-line LanguageService host around
// a SOURCE string. This consolidates that: give it source text, get back the
// generated code, the transform's side-channel outputs (segments, stalls,
// higher-order spans, source diagnostics), and helpers to type-check the OUTPUT
// and to resolve a hover at a SOURCE offset (mapped through the segments).
//
// The host mirrors the editor: it uses reactive-ts/tsconfig.json (same options as the
// transform's getCompilerOptions, plus the `corrente` path + module resolution), so
// corrente/rxjs/runtime imports resolve for real and the generated code type-checks
// exactly as it would in the editor.
'use strict';
const ts = require('typescript');
const path = require('node:path');
const { transformWithMappings, mapSourceToGenerated } = require('../ts-plugin/transform.cjs');
const { rewriteBoundaryDiagnostic } = require('../ts-plugin/boundary-diagnostics.cjs');

const REACTIVE_TS_DIR = path.join(__dirname, '..');

// The generated file lives in the transform's baseDir so emitted relative imports
// (the `render` runtime specifier, plus any hand-written `../runtime` in the source)
// resolve exactly as they would for a real .rts file in that directory.
const genPathFor = baseDir => path.join(baseDir, '__fixture__.generated.ts');

// Parse reactive-ts/tsconfig.json once — the same compiler options the editor pins.
const PROJECT_OPTIONS = (() => {
  const configPath = path.join(REACTIVE_TS_DIR, 'tsconfig.json');
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  return ts.parseJsonConfigFileContent(config, ts.sys, REACTIVE_TS_DIR).options;
})();

// Build a LanguageService serving `code` as the generated file, reading everything
// else (libs, rxjs, corrente, runtime) from disk with real module resolution.
function makeLanguageService(code, genPath) {
  const virtual = new Map([[genPath, code]]);
  const host = {
    getScriptFileNames: () => [genPath],
    getScriptVersion: () => '1',
    getScriptKind: f => (virtual.has(f) ? ts.ScriptKind.TS : undefined),
    getScriptSnapshot: f =>
      virtual.has(f)
        ? ts.ScriptSnapshot.fromString(virtual.get(f))
        : ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f)) : undefined,
    getCurrentDirectory: () => REACTIVE_TS_DIR,
    getCompilationSettings: () => PROJECT_OPTIONS,
    getDefaultLibFileName: o => ts.getDefaultLibFilePath(o),
    fileExists: f => (virtual.has(f) ? true : ts.sys.fileExists(f)),
    readFile: f => (virtual.has(f) ? virtual.get(f) : ts.sys.readFile(f)),
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };
  host.resolveModuleNameLiterals = (literals, containingFile, redirected, opts) =>
    literals.map(lit => ts.resolveModuleName(lit.text, containingFile, opts, host, undefined, redirected));
  return ts.createLanguageService(host, ts.createDocumentRegistry());
}

// Flatten a TS diagnostic to a comparable plain object.
const flatten = d => ({
  code: d.code,
  category: ts.DiagnosticCategory[d.category],
  message: ts.flattenDiagnosticMessageText(d.messageText, ' '),
});

/**
 * Transform `source` and return everything a fixture needs to assert against.
 * @param {string} source raw .rts text
 * @param {string} [baseDir] dir the transform resolves the runtime relative to (default reactive-ts/)
 */
function run(source, baseDir = REACTIVE_TS_DIR) {
  const result = transformWithMappings(ts, source, baseDir);
  const { code, segments, stalls = [], higherOrder = [] } = result;
  const genPath = genPathFor(baseDir);
  const ls = makeLanguageService(code, genPath);

  return {
    code,
    segments,
    stalls,
    higherOrder,
    // Semantic diagnostics on the GENERATED output (real module resolution).
    diagnostics: () => ls.getSemanticDiagnostics(genPath).map(flatten),
    // Teaching messages the boundary layer rewrites raw TS errors into (the
    // headline + whether the original "no call signatures" error is kept nested).
    boundaryRewrites: () =>
      ls.getSemanticDiagnostics(genPath)
        .map(d => ({ d, r: rewriteBoundaryDiagnostic(ts, d) }))
        .filter(x => x.r)
        .map(x => ({
          headline: ts.flattenDiagnosticMessageText(x.r.messageText, ' '),
          original: ts.flattenDiagnosticMessageText(x.d.messageText, ' '),
        })),
    // Resolve a hover type at a SOURCE offset, mapped to the generated file.
    // Returns the quick-info display string (whitespace-collapsed) or null.
    hoverAtSource: srcOffset => {
      const genOffset = mapSourceToGenerated(segments, srcOffset);
      if (genOffset == null) return null;
      const info = ls.getQuickInfoAtPosition(genPath, genOffset);
      return info ? ts.displayPartsToString(info.displayParts).replace(/\s+/g, ' ') : null;
    },
    ls,
    genPath,
  };
}

module.exports = { run, makeLanguageService, PROJECT_OPTIONS, genPathFor };
