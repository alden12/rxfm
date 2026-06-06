// D2 — lifting event-handler closures that capture streams. A handler runs later,
// so a captured stream must become a value: `onClick(() => f(index))` lifts to
// `onClick(index.pipe(map(index => () => f(index))))`. Streams used via their API
// (`subject.next(…)`) are left alone. Run: node tsrx/d2.mjs — non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, getCompilerOptions } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));
const COMPILER_OPTIONS = getCompilerOptions(ts);

const SOURCE = `import { Observable, Subject } from 'rxjs';
declare const index: Observable<number>;
declare const a: Observable<number>;
declare const b: Observable<string>;
declare const subj: Subject<number>;
declare function onClick(handler: (() => void) | Observable<() => void>): void;
declare function sink(n: number): void;
declare function sink2(n: number, s: string): void;
onClick(() => sink(index));
onClick(() => sink2(a, b));
onClick(() => subj.next(1));
`;

const { code } = transformWithMappings(ts, SOURCE, here);
const genPath = join(here, 'd2.generated.ts');
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

console.log('=== D2: handler-closure lifting ===');
console.log(code.split('\n').filter(l => l.startsWith('onClick(')).map(l => '  | ' + l).join('\n'));

const diags = ls.getSemanticDiagnostics(genPath);
check('generated TS has no errors', diags.length === 0);
for (const d of diags) console.log('      ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

check('single value capture → index.pipe(map(index => () => …))',
  has('onClick(index.pipe(map(index => () => sink(index))))'));
check('multi value capture → combineLatest([a, b])',
  has('onClick(combineLatest([a, b]).pipe(map(([a, b]) => () => sink2(a, b))))'));
check('stream-API use (subj.next) is NOT lifted',
  has('onClick(() => subj.next(1))'));

if (failures.length) { console.error(`\n${failures.length} check(s) failed.`); process.exit(1); }
console.log('\nAll D2 checks passed.');
