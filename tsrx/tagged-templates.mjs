// Tagged-template interpolation lifting — headless regression test.
//
// RxFM components use tagged templates for children (Div`hi ${x}`). Imperative
// observable interpolations are lifted individually (so RxFM renders each as a
// reactive child), while plain observables and non-observable interpolations are
// left untouched. Run: node tsrx/tagged-templates.mjs — exits non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, getCompilerOptions } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));
const COMPILER_OPTIONS = getCompilerOptions(ts);

const SOURCE = `import { BehaviorSubject } from 'rxjs';
import { Div } from 'rxfm';
declare const user: BehaviorSubject<{ name: string; nickname?: string }>;
declare const count: BehaviorSubject<number>;
const a = Div\`my name is \${user.name}\`;
const b = Div\`toggle (\${user.nickname ?? 'none'})\`;
const c = Div\`count = \${count}, doubled = \${count * 2}\`;
const d = Div\`static \${1 + 1}\`;
`;

const { code } = transformWithMappings(ts, SOURCE, here);
const genPath = join(here, 'tagged.generated.ts');
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

console.log('=== tagged-template interpolation lifting ===');

// Lifts apply per-interpolation; the Div`...` template structure stays intact.
check('field interpolation lifts: Div`… ${user.name}`', lineWith('a').includes('Div`my name is ${render(user.pipe(map(user => user.name)))}`'));
// `user.nickname ?? 'none'` roots in one stream (`user`), so it collapses to a
// single narrowing-preserving map (D5) rather than a lazy switchMap.
check('?? interpolation lifts', lineWith('b').includes("render(user.pipe(map(user => user.nickname ?? 'none')))"));
check('plain observable left untouched: ${count}', lineWith('c').includes('count = ${count},'));
// `count * 2` is single-root too → one map, not combineLatest (D5).
check('derived interpolation lifts: ${count * 2}', lineWith('c').includes('${render(count.pipe(map(count => count * 2)))}'));
check('non-observable interpolation untouched: ${1 + 1}', lineWith('d').includes('Div`static ${1 + 1}`'));

// The lifted interpolations are valid (ignoring the unresolved rxfm import).
const real = ls.getSemanticDiagnostics(genPath)
  .filter(d => !/Cannot find module 'rxfm'/.test(ts.flattenDiagnosticMessageText(d.messageText, ' ')));
check('lifted interpolations type-check', real.length === 0);
for (const d of real) console.log('      ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll tagged-template checks passed.');
