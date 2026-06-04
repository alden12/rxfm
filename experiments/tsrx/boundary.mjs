// Boundary diagnostics — headless regression test (uses the shared transform).
//
// Proves that imperative *reads* out of a reactive binding (which the transform
// can't lift) surface as a teaching message rather than a raw RxJS type error,
// and that unrelated errors are left untouched. Run: node experiments/tsrx/boundary.mjs
// Exits non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';
import boundaryCjs from './ts-plugin/boundary-diagnostics.cjs';

const { transformWithMappings, getCompilerOptions } = transformCjs;
const { rewriteBoundaryDiagnostic } = boundaryCjs;
const here = dirname(fileURLToPath(import.meta.url));
const COMPILER_OPTIONS = getCompilerOptions(ts);

// Member access / method calls / indexing now auto-lift (see members.mjs), so
// the remaining boundary is *calling* a non-callable stream: it must NOT be
// lifted as a function-stream, landing as `RenderObservable<number> has no call
// signatures`, which we rewrite into a teaching message. Both an arithmetic-
// derived (sum) and a call-derived (called) binding must be marked non-callable.
// One unrelated type error guards that we don't rewrite things we shouldn't.
const SOURCE = `import { Observable } from 'rxjs';
declare const y: Observable<number>;
const double = (n: number) => n * 2;
const sum = y + 1;
const c = sum(1);
const called = double(y);
const d = called(1);
const bad: string = 123;
`;

const { code } = transformWithMappings(ts, SOURCE, here);
const genPath = join(here, 'boundary.generated.ts');
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
const diagnostics = ls.getSemanticDiagnostics(genPath);

const rewritten = diagnostics
  .map(d => ({ d, r: rewriteBoundaryDiagnostic(ts, d) }))
  .filter(x => x.r)
  .map(x => ({ headline: ts.flattenDiagnosticMessageText(x.r.messageText, '\n'), original: x.d }));

const failures = [];
const check = (label, ok) => {
  console.log(`  ${ok ? '✔' : '✘'} ${label}`);
  if (!ok) failures.push(label);
};

console.log('=== boundary diagnostics ===');

// Calling a non-callable stream isn't lifted (transform fix) → teaching message.
// Both an arithmetic-derived (sum) and a call-derived (called) binding qualify:
// the emitted-type tracking must mark both non-callable.
const calls = rewritten.filter(r => r.headline.includes("calling a reactive value"));
check('calling (sum(1)) → teaching message', calls.length >= 1);
check('  names the reactive type', calls.some(r => r.headline.includes('RenderObservable<number>')));
check('  keeps the original TS error nested', calls.some(r =>
  ts.flattenDiagnosticMessageText(r.original.messageText, '\n').includes('has no call signatures')));
check('calling a call-derived binding (called(1)) → teaching message', calls.length >= 2);

// Unrelated type error is untouched.
const badUntouched = !diagnostics.some(
  d => d.code === 2322 && rewriteBoundaryDiagnostic(ts, d) !== null,
);
check('unrelated error (number → string) left untouched', badUntouched);

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll boundary checks passed.');
