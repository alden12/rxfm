// D4 — destructure an observable item param of a component-`.map` in place.
// `cells.map(({ color, neighbors, cleared }, index) => …)` renames the binding
// pattern to a synthetic stream param and treats each field as an alias that lifts
// to `item.field` wherever it's read. Fields of one item share the param, so a
// multi-field ternary collapses to a single map (like `cell.x`). A captured field
// in a handler is sourced from that same item. Run: node tsrx/d4.mjs — non-zero on failure.
//
// Uses the editor's tsconfig (real `rxfm` + runtime types) so the generated output
// — `mapToComponents`, the chainable `Div`, `render` — type-checks for real.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, mapSourceToGenerated } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));

const parsed = ts.parseJsonConfigFileContent(
  ts.readConfigFile(join(here, 'tsconfig.json'), ts.sys.readFile).config, ts.sys, here,
);
const options = parsed.options;

const SOURCE = `import { Observable } from 'rxjs';
import { Div } from 'rxfm';
declare const cells: Observable<{ color: string; symbol?: string; neighbors: number; cleared: boolean }[]>;
declare const COLORS: Record<number, string>;
declare function dispatch(index: number): void;
export const list = cells.map(({ color, symbol, neighbors, cleared }, index) =>
  Div
    .style({ backgroundColor: color, color: COLORS[neighbors] })
    .class('cell', cleared ? 'cleared' : '')
    .onClick(() => dispatch(index))
    (cleared && neighbors > 0 ? neighbors : symbol),
);
`;

const { code, segments } = transformWithMappings(ts, SOURCE, here);
const genPath = join(here, 'd4.generated.ts');
const virtual = new Map([[genPath, code]]);

const host = {
  getScriptFileNames: () => [genPath],
  getScriptVersion: () => '1',
  getScriptKind: f => (virtual.has(f) ? ts.ScriptKind.TS : undefined),
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

const ls = ts.createLanguageService(host, ts.createDocumentRegistry());

const failures = [];
const check = (label, ok) => { console.log(`  ${ok ? '✔' : '✘'} ${label}`); if (!ok) failures.push(label); };
const has = s => code.includes(s);

console.log('=== D4: destructured item-param lifting ===');
console.log(code.split('\n').map(l => '  | ' + l).join('\n'));

const prog = ls.getProgram();
const sf = prog.getSourceFile(genPath);
const diags = [...prog.getSemanticDiagnostics(sf), ...prog.getSyntacticDiagnostics(sf)];
check('generated TS has no errors', diags.length === 0);
for (const d of diags) console.log('      ✘ [' + d.code + '] ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

check('binding pattern renamed to a synthetic stream param `item`', has('(item, index) =>'));
check('field as object-literal value lifts (color → item.color)',
  has('backgroundColor: render(item.pipe(map(item => item.color)))'));
check('field as element-access index lifts (neighbors)',
  has('color: render(item.pipe(map(item => item.neighbors)).pipe(map(neighbors => COLORS[neighbors])))'));
check('single-field ternary collapses to one map (cleared)',
  has("render(item.pipe(map(item => item.cleared ? 'cleared' : '')))"));
check('multi-field ternary shares the item param → one map',
  has('render(item.pipe(map(item => item.cleared && item.neighbors > 0 ? item.neighbors : item.symbol)))'));
check('handler captures the index stream (not a field)',
  has('onClick(index.pipe(map(index => () => dispatch(index))))'));

// Hover: a destructured field USE in the source maps through to its generated
// property token, so the editor resolves a real type for it (not `any`/nothing).
console.log('\n--- live hover on destructured field uses (source → type) ---');
const hover = (label, srcUse, wantType) => {
  const srcOffset = SOURCE.indexOf(srcUse) + srcUse.length - srcUse.match(/[A-Za-z0-9_]+$/)[0].length;
  const genOffset = mapSourceToGenerated(segments, srcOffset);
  const info = genOffset == null ? null : ls.getQuickInfoAtPosition(genPath, genOffset);
  const type = info ? ts.displayPartsToString(info.displayParts) : '(no info)';
  console.log(`  hover ${srcUse.trim()}  ⇒  ${type}`);
  check(label, type.includes(wantType));
};
hover('hover `color` use → string', 'backgroundColor: color', ': string');
hover('hover `neighbors` use → number', 'COLORS[neighbors', ': number');
hover('hover `symbol` use → string (optional)', '? neighbors : symbol', ': string');
// Declaration site: hovering the field in the `{ … }` pattern itself resolves too.
hover('hover `color` in the binding pattern → string', '{ color', ': string');

if (failures.length) { console.error(`\n${failures.length} check(s) failed.`); process.exit(1); }
console.log('\nAll D4 checks passed.');
