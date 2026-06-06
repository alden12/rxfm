// Full-output check of the split snake, mirroring the editor as closely as headless
// allows: the generated TS of both .tsrx files is type-checked under the SAME
// tsconfig options the editor uses (tsrx/tsconfig.json — incl. the `rxfm` path),
// with the REAL plugin fallback resolving the cross-file `./game` import. Proves the
// split snake type-checks end-to-end with editor-side cross-.tsrx resolution.
// Run: node tsrx/snake-split.mjs — exits non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import transformCjs from './ts-plugin/transform.cjs';
import pluginCjs from './ts-plugin/index.cjs';

const { transformWithMappings } = transformCjs;
const { patchTsrxModuleResolution } = pluginCjs;
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, 'examples', 'snake-game');

// Editor options, straight from the tsconfig that governs .tsrx files.
const parsed = ts.parseJsonConfigFileContent(
  ts.readConfigFile(join(here, 'tsconfig.json'), ts.sys.readFile).config,
  ts.sys,
  here,
);
const options = parsed.options;

// The view is served at a .ts path so it's a valid program root; the engine keeps
// its .tsrx extension so it must go through our fallback resolver (the thing we test).
const enginePath = join(dir, 'game.tsrx');
const viewPath = join(dir, 'snake-game.ts');
const cssShim = join(dir, '__css__.d.ts');
const virtual = new Map([
  [enginePath, transformWithMappings(ts, readFileSync(join(dir, 'game.tsrx'), 'utf8'), dir).code],
  [viewPath, transformWithMappings(ts, readFileSync(join(dir, 'snake-game.tsrx'), 'utf8'), dir).code],
  [cssShim, "declare module '*.css';\n"],
]);

const host = {
  getScriptFileNames: () => [viewPath, cssShim],
  getScriptVersion: () => '1',
  getScriptKind: f => (f.endsWith('.tsrx') || virtual.has(f) ? ts.ScriptKind.TS : undefined),
  getScriptSnapshot: f =>
    virtual.has(f)
      ? ts.ScriptSnapshot.fromString(virtual.get(f))
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
// Stock resolveModuleNameLiterals, then the REAL plugin fallback over it.
host.resolveModuleNameLiterals = (literals, containingFile, redirected, opts) =>
  literals.map(lit => ts.resolveModuleName(lit.text, containingFile, opts, host, undefined, redirected));
patchTsrxModuleResolution(ts, host);

const ls = ts.createLanguageService(host, ts.createDocumentRegistry());

const failures = [];
const check = (label, ok) => {
  console.log(`  ${ok ? '✔' : '✘'} ${label}`);
  if (!ok) failures.push(label);
};

console.log('=== split snake — full-output type-check ===');

const diags = [
  ...ls.getSemanticDiagnostics(viewPath),
  ...ls.getSyntacticDiagnostics(viewPath),
];
check('view (snake-game) output type-checks with no errors', diags.length === 0);
for (const d of diags) console.log('      ✘ [' + d.code + '] ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

// The cross-file import resolved (no 2307) and `board` carried its real type.
const prog = ls.getProgram();
const checker = prog.getTypeChecker();
const sf = prog.getSourceFile(viewPath);
let boardType = '';
sf && ts.forEachChild(sf, function walk(node) {
  if (ts.isImportDeclaration(node) && node.moduleSpecifier.getText().includes('./game')) {
    const sym = checker.getSymbolAtLocation(node.importClause.namedBindings.elements[0].name);
    if (sym) boardType = checker.typeToString(checker.getTypeOfSymbolAtLocation(sym, node));
  }
  ts.forEachChild(node, walk);
});
console.log(`  imported board: ${boardType}`);
check('cross-.tsrx import `board` typed as RenderObservable<SnakeBoard>', /RenderObservable<SnakeBoard>/.test(boardType));

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nSplit snake type-checks end-to-end. Editor-side cross-.tsrx resolution works.');
