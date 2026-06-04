// Verify the EDITOR code path headlessly.
//
// Drives the real Volar LanguagePlugin's `createVirtualCode` (the exact code the
// tsserver plugin runs), then uses its Volar `mappings` to map a source hover
// position into the generated TS and asks the TS language service for the type.
// If this passes, the only unverified bit left is VS Code's packaging/wiring.
// Run: node experiments/tsrx/verify-plugin.mjs
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTsrxLanguagePlugin } from './ts-plugin/language-plugin.cjs';
import transformCjs from './ts-plugin/transform.cjs';

const { getCompilerOptions } = transformCjs;
const COMPILER_OPTIONS = getCompilerOptions(ts);

const here = dirname(fileURLToPath(import.meta.url));
const sourceText = readFileSync(join(here, 'example.input.ts'), 'utf8');
const tsrxUri = join(here, 'example.input.tsrx'); // pretend extension so the plugin engages
const genPath = join(here, '__gen__.ts');

// --- run the plugin exactly as tsserver would -----------------------------
const plugin = createTsrxLanguagePlugin(ts);
const languageId = plugin.getLanguageId(tsrxUri);
const snapshot = ts.ScriptSnapshot.fromString(sourceText);
const virtualCode = plugin.createVirtualCode(tsrxUri, languageId, snapshot);
const code = virtualCode.snapshot.getText(0, virtualCode.snapshot.getLength());
const mappings = virtualCode.mappings;

// Map a source offset → generated offset using the plugin's Volar mappings.
function mapViaVolar(srcOffset) {
  for (const m of mappings) {
    const srcStart = m.sourceOffsets[0];
    const srcLen = m.lengths[0];
    if (srcOffset < srcStart || srcOffset >= srcStart + srcLen) continue;
    const genStart = m.generatedOffsets[0];
    const isIdentity = !m.generatedLengths || m.generatedLengths[0] === srcLen;
    return isIdentity ? genStart + (srcOffset - srcStart) : genStart;
  }
  return null;
}

function createLanguageService(fileName, text) {
  const host = {
    getScriptFileNames: () => [fileName],
    getScriptVersion: () => '1',
    getScriptSnapshot: f =>
      f === fileName ? ts.ScriptSnapshot.fromString(text)
        : (ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f)) : undefined),
    getCurrentDirectory: () => here,
    getCompilationSettings: () => COMPILER_OPTIONS,
    getDefaultLibFileName: o => ts.getDefaultLibFilePath(o),
    fileExists: f => (f === fileName ? true : ts.sys.fileExists(f)),
    readFile: f => (f === fileName ? text : ts.sys.readFile(f)),
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };
  return ts.createLanguageService(host, ts.createDocumentRegistry());
}
const ls = createLanguageService(genPath, code);

const srcSf = ts.createSourceFile('in.tsrx', sourceText, ts.ScriptTarget.ES2020, true);
const targets = [];
srcSf.forEachChild(function walk(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    targets.push({ name: node.name.text, srcOffset: node.name.getStart(srcSf) });
  }
  node.forEachChild(walk);
});

let ok = true;
console.log(`languageId for .tsrx  ⇒  ${languageId}`);
console.log(`virtual code languageId ⇒  ${virtualCode.languageId}`);
console.log(`${mappings.length} Volar mappings emitted\n`);
console.log('=== HOVER via plugin mappings (source pos → type) ===\n');
for (const { name, srcOffset } of targets) {
  const genOffset = mapViaVolar(srcOffset);
  const info = genOffset == null ? null : ls.getQuickInfoAtPosition(genPath, genOffset);
  const type = info ? ts.displayPartsToString(info.displayParts) : '(no info)';
  console.log(`  hover ${name}  ⇒  ${type}`);
  if (name === 'x' || name === 'w') ok = ok && /Observable<number>/.test(type);
}
const genDiagnostics = [...ls.getSyntacticDiagnostics(genPath), ...ls.getSemanticDiagnostics(genPath)];
console.log(`\ngenerated diagnostics: ${genDiagnostics.length}`);
ok = ok && genDiagnostics.length === 0;

console.log('\n' + (ok
  ? 'PASS ✔  plugin code path yields Observable<number> with no errors.'
  : 'FAIL ✘  see above.'));
process.exit(ok ? 0 : 1);
