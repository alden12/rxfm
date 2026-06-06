// D5 — single-root operator chains collapse to one map. When every observable in a
// binary / unary / logical expression roots in ONE stream, it lifts as
// `x.pipe(map(x => <verbatim>))` (narrowing preserved) instead of a (nested)
// combineLatest. Multi-stream expressions still combineLatest; a stream-API use
// (`x.value`) is left alone. Run: node tsrx/d5.mjs — non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, mapSourceToGenerated, getCompilerOptions } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));
const COMPILER_OPTIONS = getCompilerOptions(ts);

const SOURCE = `import { BehaviorSubject, Observable } from 'rxjs';
declare const count: Observable<number>;
declare const other: Observable<number>;
declare const user: Observable<{ active: boolean; name: string }>;
const clicks = new BehaviorSubject(0);
const doubled = count * 2;
const chained = count % 2 === 0;
const negated = !user.active;
const fallback = user.name || 'anon';
const combined = count + other;
const fromValue = clicks.value + 1;
`;

const { code, segments } = transformWithMappings(ts, SOURCE, here);
const genPath = join(here, 'd5.generated.ts');
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

console.log('=== D5: single-root operator collapse ===');
console.log(code.split('\n').filter(l => /doubled|chained|negated|fallback|combined|fromValue/.test(l) && l.includes('=')).map(l => '  | ' + l.trim()).join('\n'));

const diags = ls.getSemanticDiagnostics(genPath);
check('generated TS has no errors', diags.length === 0);
for (const d of diags) console.log('      ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

check('binary single-root → one map', has('doubled = render(count.pipe(map(count => count * 2)))'));
check('operator chain single-root → one map (not nested combineLatest)',
  has('chained = render(count.pipe(map(count => count % 2 === 0)))'));
check('unary over a member → one map', has('negated = render(user.pipe(map(user => !user.active)))'));
check('logical single-root → one map', has("fallback = render(user.pipe(map(user => user.name || 'anon')))"));
check('multi-stream still combineLatest', has('combined = render(combineLatest([count, other])'));
check('stream-API use (clicks.value) is NOT collapsed', has('fromValue = clicks.value + 1') || has('render(clicks.value + 1'));
// `clicks.value + 1` reads the BehaviorSubject value synchronously — it must stay a
// plain expression (no `clicks.pipe(map(clicks => clicks.value + 1))`, which would
// rebind `clicks` to a number and break `.value`).
check('  not mis-collapsed over clicks', !has('clicks.pipe(map(clicks => clicks.value'));

// Hover: the collapsed root maps to the OUTER stream reference, so hovering the
// variable shows its declared `Observable<…>` type (not the in-map value), matching
// the member-access lift and the variable's declaration.
console.log('\n--- root hover (source → type) ---');
const hover = srcUse => {
  const off = SOURCE.indexOf(srcUse);
  const g = mapSourceToGenerated(segments, off);
  const info = g == null ? null : ls.getQuickInfoAtPosition(genPath, off === -1 ? 0 : g);
  return info ? ts.displayPartsToString(info.displayParts).replace(/\s+/g, ' ') : '(no info)';
};
const t1 = hover('count * 2');           // the `count` in `count * 2`
const t2 = hover('user.name || ');       // the `user` in the logical
console.log(`  hover count (in count * 2)  ⇒  ${t1}`);
console.log(`  hover user (in user.name || …)  ⇒  ${t2}`);
check('binary root hovers as Observable<number>', /count: Observable<number>/.test(t1));
check('logical root hovers as Observable<…>', /user: Observable</.test(t2));

if (failures.length) { console.error(`\n${failures.length} check(s) failed.`); process.exit(1); }
console.log('\nAll D5 checks passed.');
