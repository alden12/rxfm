// Editor-side cross-.tsrx import resolution — headless reproduction + fix proof.
//
// In the editor, Volar serves each .tsrx file to tsserver as its *virtual* TS.
// A bare `import { seconds } from './producer'` must resolve to the sibling
// producer.tsrx (served as .ts) so the imported reactive value carries its real
// type and downstream derivations lift. This harness emulates that host with a
// real ts.LanguageService and shows:
//   (A) stock TS resolution fails  -> "Cannot find module './producer'" (2307)
//   (B) our fallback resolver makes it resolve, and the cross-file lift type-checks
// Run: node tsrx/editor-resolution.mjs — exits non-zero on failure.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import transformCjs from './ts-plugin/transform.cjs';
import pluginCjs from './ts-plugin/index.cjs';

const { transformWithMappings, getCompilerOptions } = transformCjs;
const { patchTsrxModuleResolution } = pluginCjs;
const here = dirname(fileURLToPath(import.meta.url));
const COMPILER_OPTIONS = getCompilerOptions(ts);

// Self-contained fixtures: a reactive producer and a consumer that derives from its
// imported stream. Written under tsrx/ (so the producer's `../runtime` import
// resolves) and cleaned up at exit.
const dir = mkdtempSync(join(here, '.cross-tsrx-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'producer.tsrx'), `import { interval } from '../runtime';
export const seconds = interval(1000);
`);
const consumerSrc = `import { seconds } from './producer';
const doubled = seconds * 2;
`;

// The import *target* keeps its .tsrx extension (so stock TS resolution genuinely
// can't find it — the bug). The consumer is served at a .ts path so it's a valid
// program root; in the real editor the .tsrx root is admitted via the program's
// extraFileExtensions, which is orthogonal to the resolution concern under test.
const producerPath = join(dir, 'producer.tsrx');
const consumerPath = join(dir, 'consumer.ts');
const readProducer = () => transformWithMappings(ts, ts.sys.readFile(producerPath), dir).code;
const virtual = new Map([
  [producerPath, readProducer()],
  [consumerPath, transformWithMappings(ts, consumerSrc, dir).code],
]);

// Emulate Volar's decorated host: .tsrx files are served as their virtual TS.
function makeHost({ withFallback }) {
  const host = {
    getScriptFileNames: () => [consumerPath],
    getScriptVersion: () => '1',
    getScriptKind: f => (virtual.has(f) ? ts.ScriptKind.TS : undefined),
    getScriptSnapshot: f =>
      virtual.has(f)
        ? ts.ScriptSnapshot.fromString(virtual.get(f))
        : ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f)) : undefined,
    getCurrentDirectory: () => dir,
    getCompilationSettings: () => COMPILER_OPTIONS,
    getDefaultLibFileName: o => ts.getDefaultLibFilePath(o),
    fileExists: f => (virtual.has(f) ? true : ts.sys.fileExists(f)),
    readFile: f => (virtual.has(f) ? virtual.get(f) : ts.sys.readFile(f)),
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };
  // tsserver/Volar provide resolveModuleNameLiterals; emulate the stock one, then
  // (for the fix case) layer the REAL plugin fallback over it — same code path the
  // extension ships, so this proves the shipped fix, not a reimplementation.
  host.resolveModuleNameLiterals = (literals, containingFile, redirected, options) =>
    literals.map(lit => ts.resolveModuleName(lit.text, containingFile, options, host, undefined, redirected));
  if (withFallback) patchTsrxModuleResolution(ts, host);
  return host;
}

const failures = [];
const check = (label, ok) => {
  console.log(`  ${ok ? '✔' : '✘'} ${label}`);
  if (!ok) failures.push(label);
};

console.log('=== editor-side cross-.tsrx resolution ===');

// (A) stock resolution — should fail with 2307 on './producer'
const stockLs = ts.createLanguageService(makeHost({ withFallback: false }), ts.createDocumentRegistry());
const stockDiags = stockLs.getSemanticDiagnostics(consumerPath);
const stock2307 = stockDiags.some(d => d.code === 2307);
check('stock resolution reproduces "Cannot find module" (2307)', stock2307);

// (B) with fallback — should resolve and type-check clean
const fixLs = ts.createLanguageService(makeHost({ withFallback: true }), ts.createDocumentRegistry());
const fixDiags = fixLs.getSemanticDiagnostics(consumerPath);
check('fallback resolver: no errors', fixDiags.length === 0);
for (const d of fixDiags) console.log('      ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));

// Cross-file type really crossed: `doubled` is RenderObservable<number>.
const prog = fixLs.getProgram();
const sf = prog.getSourceFile(consumerPath);
const checker = prog.getTypeChecker();
let doubledType = '';
sf && ts.forEachChild(sf, function walk(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText() === 'doubled') {
    doubledType = checker.typeToString(checker.getTypeAtLocation(node.name));
  }
  ts.forEachChild(node, walk);
});
console.log(`  doubled: ${doubledType}`);
check('cross-file lift typed as RenderObservable<number>', /RenderObservable<number>/.test(doubledType));

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll editor-resolution checks passed.');
