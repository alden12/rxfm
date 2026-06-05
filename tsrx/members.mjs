// Member-access lifting — headless regression test (uses the shared transform).
//
// Property access, method calls and indexing on a stream auto-lift to map/
// combineLatest, while members of the stream API itself (.value, .pipe, …) are
// left untouched. Run: node tsrx/members.mjs — exits non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, getCompilerOptions } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));
const COMPILER_OPTIONS = getCompilerOptions(ts);

const SOURCE = `import { Observable, BehaviorSubject } from 'rxjs';
declare const user: Observable<{ name: string; address: { city: string } }>;
declare const count: Observable<number>;
declare const items: Observable<string[]>;
declare const idx: Observable<number>;
const subject = new BehaviorSubject(0);
const name = user.name;
const city = user.address.city;
const fixed = count.toFixed(2);
const first = items[0];
const dyn = items[idx];
const cur = subject.value;
const piped = count.pipe();
`;

const { code } = transformWithMappings(ts, SOURCE, here);
const genPath = join(here, 'members.generated.ts');
const host = {
  getScriptFileNames: () => [genPath],
  getScriptVersion: () => '1',
  getScriptSnapshot: f =>
    f === genPath
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
const check = (label, ok) => {
  console.log(`  ${ok ? '✔' : '✘'} ${label}`);
  if (!ok) failures.push(label);
};
const lineWith = decl => code.split('\n').find(l => l.startsWith(`const ${decl} `)) || '';

console.log('=== member-access lifting ===');

// Everything type-checks (the lifts are valid RxJS).
const diags = ls.getSemanticDiagnostics(genPath);
check('generated TS has no errors', diags.length === 0);
for (const d of diags) console.log('      ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

// Value members lift to map over the stream.
check('field extraction: user.name → map(u => u.name)', lineWith('name').includes('user.pipe(map(user => user.name))'));
check('nested field: user.address.city → chained maps', lineWith('city').includes('map(user => user.address)).pipe(map(_o => _o.city))'));
check('method call: count.toFixed(2) → combineLatest + call on value', lineWith('fixed').includes('count.toFixed(_a0)'));
check('static index: items[0] → map(i => i[0])', lineWith('first').includes('items.pipe(map(items => items[0]))'));
check('dynamic index: items[idx] → combineLatest both', lineWith('dyn').includes('combineLatest([items, idx]).pipe(map(([items, _i]) => items[_i]))'));

// Stream-API members are left alone (operate on the stream, not its value).
check('stream member preserved: subject.value not lifted', lineWith('cur').includes('= subject.value;') && !lineWith('cur').includes('render('));
check('stream member preserved: count.pipe() not lifted', lineWith('piped').includes('= count.pipe();') && !lineWith('piped').includes('map('));

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll member-access checks passed.');
