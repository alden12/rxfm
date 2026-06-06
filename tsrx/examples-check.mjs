// Full-output type-check of every structured tsrx example. For each example dir it
// transforms all `.tsrx` files, serves them (plus their `.ts` siblings) under the
// editor's tsconfig with the real plugin fallback resolving cross-`.tsrx` imports,
// and reports any genuine output errors — the same thing the editor would show.
// Run: node tsrx/examples-check.mjs — exits non-zero on any error.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import transformCjs from './ts-plugin/transform.cjs';
import pluginCjs from './ts-plugin/index.cjs';

const { transformWithMappings } = transformCjs;
const { patchTsrxModuleResolution } = pluginCjs;
const here = dirname(fileURLToPath(import.meta.url));
// The structured example suite was promoted to the top-level `examples/` (sibling
// of `tsrx/`) when tsrx became the default style; loose transform fixtures stay here.
const examples = join(here, '..', 'examples');

const parsed = ts.parseJsonConfigFileContent(
  ts.readConfigFile(join(here, 'tsconfig.json'), ts.sys.readFile).config, ts.sys, here,
);
const options = parsed.options;

// The structured example dirs to sweep (each a self-contained little app).
const DIRS = ['todo-list', 'basic', 'snake-game', 'minesweeper'].filter(d => existsSync(join(examples, d)));

const fmt = d => `[${d.code}] ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
let totalErrors = 0;

for (const name of DIRS) {
  const dir = join(examples, name);
  const tsrxFiles = readdirSync(dir).filter(f => f.endsWith('.tsrx'));
  if (!tsrxFiles.length) continue;

  // Each .tsrx is served at a .ts path (valid program root) carrying its generated
  // code; cross-file imports still say `./game`, so the fallback resolver maps them
  // to the sibling `.tsrx` (also served as .ts). A css shim covers `import './x.css'`.
  const cssShim = join(dir, '__css__.d.ts');
  const virtual = new Map([[cssShim, "declare module '*.css';\n"]]);
  const roots = [cssShim];
  for (const f of tsrxFiles) {
    const tsPath = join(dir, f.replace(/\.tsrx$/, '.ts'));
    const tsrxPath = join(dir, f);
    const code = transformWithMappings(ts, readFileSync(tsrxPath, 'utf8'), dir).code;
    virtual.set(tsPath, code);   // program root
    virtual.set(tsrxPath, code); // resolution target for `./sibling`
    roots.push(tsPath);
  }

  const host = {
    getScriptFileNames: () => roots,
    getScriptVersion: () => '1',
    getScriptKind: f => (f.endsWith('.tsrx') || virtual.has(f) ? ts.ScriptKind.TS : undefined),
    getScriptSnapshot: f =>
      virtual.has(f) ? ts.ScriptSnapshot.fromString(virtual.get(f))
        : ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f)) : undefined,
    getCurrentDirectory: () => here,
    getCompilationSettings: () => options,
    getDefaultLibFileName: o => ts.getDefaultLibFilePath(o),
    fileExists: f => (virtual.has(f) ? true : ts.sys.fileExists(f)),
    readFile: f => (virtual.has(f) ? virtual.get(f) : ts.sys.readFile(f)),
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };
  host.resolveModuleNameLiterals = (literals, containingFile, redirected, opts) =>
    literals.map(lit => ts.resolveModuleName(lit.text, containingFile, opts, host, undefined, redirected));
  patchTsrxModuleResolution(ts, host);

  const ls = ts.createLanguageService(host, ts.createDocumentRegistry());
  const prog = ls.getProgram();

  let dirErrors = 0;
  const lines = [];
  for (const f of tsrxFiles) {
    const tsPath = join(dir, f.replace(/\.tsrx$/, '.ts'));
    const sf = prog.getSourceFile(tsPath);
    const diags = [...prog.getSemanticDiagnostics(sf), ...prog.getSyntacticDiagnostics(sf)];
    dirErrors += diags.length;
    lines.push(`    ${diags.length ? '✘' : '✔'} ${f} (${diags.length})`);
    for (const d of diags) lines.push('        ✘ ' + fmt(d));
  }
  totalErrors += dirErrors;
  console.log(`\n=== ${name} (${dirErrors} error${dirErrors === 1 ? '' : 's'}) ===`);
  console.log(lines.join('\n'));
}

console.log(totalErrors === 0 ? '\n✔ All examples type-check end-to-end.' : `\n✘ ${totalErrors} error(s) total.`);
process.exit(totalErrors === 0 ? 0 : 1);
