// D1 — lifting in more positions: destructuring an observable, and observable
// values inside object literals. Headless regression test (shared transform).
// Run: node tsrx/d1.mjs — exits non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, getCompilerOptions } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));
const COMPILER_OPTIONS = getCompilerOptions(ts);

const SOURCE = `import { Observable } from 'rxjs';
declare const game: Observable<{ board: string[]; stage: string }>;
declare const cell: Observable<{ color: string; size: number }>;
declare function styles(s: { background: string | Observable<string>; fontSize: string | Observable<number> }): void;
declare function klass(...names: (string | Observable<string>)[]): void;
const { board, stage } = game;
const len = stage.length;
styles({ background: cell.color, fontSize: cell.size });
klass('base', cell.size > 1 ? 'big' : 'small');
`;

const { code } = transformWithMappings(ts, SOURCE, here);
const genPath = join(here, 'd1.generated.ts');
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

console.log('=== D1: destructuring + object-literal lifting ===');
console.log(code.split('\n').filter(l => /board|stage|len|styles\(|klass\(/.test(l)).map(l => '  | ' + l).join('\n'));

const diags = ls.getSemanticDiagnostics(genPath);
check('generated TS has no errors', diags.length === 0);
for (const d of diags) console.log('      ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

check('destructured `board` → member-access map', has('board = render(game.pipe(map(game => game.board)))'));
check('destructured `stage` → member-access map', has('stage = render(game.pipe(map(game => game.stage)))'));
check('object value `cell.color` lifted in place', has('background: render(cell.pipe(map(cell => cell.color)))'));
check('object value `cell.size` lifted in place', has('fontSize: render(cell.pipe(map(cell => cell.size)))'));
check('destructured binding propagates (stage.length lifts)', has('len = render(stage.pipe(map(stage => stage.length)))'));
check('call argument lifts in place (ternary in klass(...))',
  has("klass('base', render(cell.pipe(map(cell => cell.size > 1 ? 'big' : 'small'))))"));

if (failures.length) { console.error(`\n${failures.length} check(s) failed.`); process.exit(1); }
console.log('\nAll D1 checks passed.');
