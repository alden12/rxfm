// D3 — preserve control-flow narrowing for single-observable value ternaries.
// `x === undefined ? 0 : x + 1` lifts to `x.pipe(map(x => x === undefined ? 0 : x + 1))`
// so the guard narrows `x` in its branch (no spurious "possibly undefined").
// Run: node tsrx/d3.mjs — exits non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, getCompilerOptions } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));
const COMPILER_OPTIONS = getCompilerOptions(ts);

const SOURCE = `import { Observable } from 'rxjs';
declare const x: Observable<number | undefined>;
declare const cell: Observable<{ symbol?: string; n: number }>;
const elapsed = x === undefined ? 0 : x + 1;
const guarded = !x ? 0 : x + 1;
const size = cell.symbol ? '12px' : '14px';
`;

const { code } = transformWithMappings(ts, SOURCE, here);
const genPath = join(here, 'd3.generated.ts');
const host = {
  getScriptFileNames: () => [genPath],
  getScriptVersion: () => '1',
  getScriptSnapshot: f => f === genPath
    ? ts.ScriptSnapshot.fromString(code)
    : ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f)) : undefined,
  getCurrentDirectory: () => here,
  getCompilationSettings: () => COMPILER_OPTIONS,
  getDefaultLibFileName: o => ts.getDefaultLibFilePath(o),
  fileExists: f => (f === genPath ? true : ts.sys.fileExists(f)),
  readFile: f => (f === genPath ? code : ts.sys.readFile(f)),
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};
const ls = ts.createLanguageService(host, ts.createDocumentRegistry());

const failures = [];
const check = (label, ok) => { console.log(`  ${ok ? '✔' : '✘'} ${label}`); if (!ok) failures.push(label); };
const has = s => code.includes(s);

console.log('=== D3: narrowing in single-observable value ternaries ===');
console.log(code.split('\n').filter(l => /elapsed|guarded|size/.test(l)).map(l => '  | ' + l).join('\n'));

const diags = ls.getSemanticDiagnostics(genPath);
check('generated TS has no errors (guard narrows in branch)', diags.length === 0);
for (const d of diags) console.log('      ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

check('=== guard lifts to one map with a plain ternary', has('render(x.pipe(map(x => x === undefined ? 0 : x + 1)))'));
check('!x guard lifts likewise', has('render(x.pipe(map(x => !x ? 0 : x + 1)))'));
check('member-rooted ternary collapses to one map', has("render(cell.pipe(map(cell => cell.symbol ? '12px' : '14px')))"));

if (failures.length) { console.error(`\n${failures.length} check(s) failed.`); process.exit(1); }
console.log('\nAll D3 checks passed.');
