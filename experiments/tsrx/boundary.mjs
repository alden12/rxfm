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

// `sum` becomes RenderObservable<number>; the following lines reach into it
// imperatively (member access, indexing, calling) — the boundary — plus one
// unrelated type error that must NOT be rewritten. The call case also guards a
// transform fix: a non-callable stream must NOT be lifted as a function-stream,
// so it lands as `RenderObservable<number> has no call signatures` here.
const SOURCE = `import { Observable } from 'rxjs';
declare const y: Observable<number>;
const sum = y + 1;
const a = sum.toFixed(2);
const b = sum[0];
const c = sum(1);
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

// Property access on a reactive value teaches "map over it".
const prop = rewritten.find(r => r.headline.includes("'toFixed' isn't available"));
check('property access (sum.toFixed) → teaching message', !!prop);
check('  names the reactive type', !!prop && prop.headline.includes('RenderObservable<number>'));
check('  suggests .pipe(map(...))', !!prop && prop.headline.includes('.pipe(map(v => v.toFixed))'));
check(
  '  keeps the original TS error nested',
  !!prop && typeof prop.original.messageText !== 'undefined' &&
    ts.flattenDiagnosticMessageText(prop.original.messageText, '\n').includes("Property 'toFixed' does not exist"),
);

// Indexing a reactive value teaches "map over it".
const index = rewritten.find(r => r.headline.includes('indexing a reactive value'));
check('indexing (sum[0]) → teaching message', !!index);
check('  names the reactive type', !!index && index.headline.includes('RenderObservable<number>'));

// Calling a non-callable stream isn't lifted (transform fix) → teaching message.
const call = rewritten.find(r => r.headline.includes("calling a reactive value"));
check('calling (sum(1)) → teaching message', !!call);
check('  names the reactive type', !!call && call.headline.includes('RenderObservable<number>'));

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
