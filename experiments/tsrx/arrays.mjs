// Array lifting (.map → mapToComponents) — headless regression test.
//
// `obsArray.map(item => <component>)` is the imperative way to render a list; it
// lifts to mapToComponents (keyed reconciliation) with the callback's item param
// treated as an observable. A second arg supplies the key (prop name or fn),
// defaulting to index. Value-maps (i => i.name) stay naive array maps.
// Run: node experiments/tsrx/arrays.mjs — exits non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, mapSourceToGenerated, getCompilerOptions } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));
const COMPILER_OPTIONS = getCompilerOptions(ts);

const SOURCE = `import { BehaviorSubject } from 'rxjs';
import { Div } from 'rxfm';
declare const items: BehaviorSubject<{ id: number; name: string; done: boolean }[]>;
const a = items.map(item => Div\`\${item.name} is \${item.done ? 'done' : 'todo'}\`);
const b = items.map(item => Div\`\${item.name}\`, 'id');
const c = items.map(item => Div\`\${item.name}\`, item => item.id);
const names = items.map(i => i.name);
const visible = items.filter(i => i.done).map(item => Div\`\${item.name}\`, 'id');
const nested = Div(items.map(item => Div\`\${item.name}\`));
`;

const { code, segments } = transformWithMappings(ts, SOURCE, here);
const genPath = join(here, 'arrays.generated.ts');
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

console.log('=== array lifting (.map → mapToComponents) ===');

// Component-map → mapToComponents, with the item field lifted in the callback.
check('default keying (index): items.map(cb)',
  lineWith('a').includes('items.pipe(mapToComponents(item =>')
  && lineWith('a').includes('render(item.pipe(map(item => item.name)))'));
check('key prop: items.map(cb, \'id\')', lineWith('b').includes("}`, 'id'))"));
check('key function: items.map(cb, item => item.id)', lineWith('c').includes('}`, item => item.id))'));

// Value-map stays a naive array map, callback inline (no implicit any).
check('value-map stays naive: items.map(i => i.name)',
  lineWith('names').includes('items.map(i => i.name)') && !lineWith('names').includes('mapToComponents'));

// filter → map composes: receiver lifted, then mapToComponents.
check('filter→map composes into mapToComponents',
  lineWith('visible').includes('items.filter(i => i.done)') && lineWith('visible').includes('.pipe(mapToComponents('));

// Component-map as a child keeps the surrounding component call intact.
check('Div(items.map(...)) keeps Div, lifts inner',
  lineWith('nested').includes('Div(items.pipe(mapToComponents('));

// mapToComponents is imported from rxfm.
check('mapToComponents imported from rxfm', code.includes('import { mapToComponents } from "rxfm";'));

// Hovering the `.map` token shows mapToComponents (remapped, not a dead spot).
const mapOffset = SOURCE.indexOf('.map(') + 1;
const genOffset = mapSourceToGenerated(segments, mapOffset);
const info = genOffset == null ? null : ls.getQuickInfoAtPosition(genPath, genOffset);
check('hover on `.map` resolves to mapToComponents',
  !!info && ts.displayPartsToString(info.displayParts).includes('mapToComponents'));

// Everything type-checks (ignoring the unresolved rxfm import in this harness).
const real = ls.getSemanticDiagnostics(genPath)
  .filter(d => !/Cannot find module 'rxfm'/.test(ts.flattenDiagnosticMessageText(d.messageText, ' ')));
check('generated TS has no errors', real.length === 0);
for (const d of real) console.log('      ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll array checks passed.');
