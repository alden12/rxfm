// Live editor types — headless proof (uses the shared transform).
//
// Simulates a hover: take a position in the .tsrx SOURCE, map it through to the
// generated TS, ask the TS language service for the type, and report diagnostics.
// Run: node tsrx/live-types.mjs
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, mapSourceToGenerated, getCompilerOptions } = transformCjs;
const COMPILER_OPTIONS = getCompilerOptions(ts);

const here = dirname(fileURLToPath(import.meta.url));
const inputPath = join(here, 'example.input.ts');
const genPath = join(here, 'example.generated.ts'); // virtual; resolves rxjs from repo node_modules

const sourceText = readFileSync(inputPath, 'utf8');
const { code, segments, sourceDiagnostics } = transformWithMappings(ts, sourceText, here);

function createLanguageService(fileName, text) {
  const host = {
    getScriptFileNames: () => [fileName],
    getScriptVersion: () => '1',
    getScriptSnapshot: f =>
      f === fileName
        ? ts.ScriptSnapshot.fromString(text)
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
const lineCol = off => {
  const { line, character } = srcSf.getLineAndCharacterOfPosition(off);
  return `${line + 1}:${character + 1}`;
};

console.log('=== GENERATED TS (what the language service sees) ===\n');
console.log(code);
console.log('=== LIVE HOVER (hover position in .tsrx source → inferred type) ===\n');
for (const { name, srcOffset } of targets) {
  const genOffset = mapSourceToGenerated(segments, srcOffset);
  const info = genOffset == null ? null : ls.getQuickInfoAtPosition(genPath, genOffset);
  const type = info ? ts.displayPartsToString(info.displayParts) : '(no info)';
  console.log(`  hover ${name} @ ${lineCol(srcOffset)}  ⇒  ${type}`);
}

console.log('\n=== DIAGNOSTICS ===\n');
console.log(`  .tsrx source (raw, as plain TS): ${sourceDiagnostics.length} error(s)`);
for (const d of sourceDiagnostics) console.log('    ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, '\n'));
const genDiagnostics = [...ls.getSyntacticDiagnostics(genPath), ...ls.getSemanticDiagnostics(genPath)];
console.log(`  generated TS (what you'd see in the editor): ${genDiagnostics.length} error(s)` +
  (genDiagnostics.length === 0 ? '  ✔ no red squiggles' : ''));
for (const d of genDiagnostics) console.log('    ✘ ' + ts.flattenDiagnosticMessageText(d.messageText, '\n'));
