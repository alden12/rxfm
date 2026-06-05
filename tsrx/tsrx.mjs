// tsrx — transform demo. Prints before/after and re-checks the output types.
// Run: node tsrx/tsrx.mjs
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings, getCompilerOptions } = transformCjs;

const here = dirname(fileURLToPath(import.meta.url));
const inputPath = join(here, 'example.input.ts');
const outputPath = join(here, 'example.output.ts');

const sourceText = readFileSync(inputPath, 'utf8');
const { code } = transformWithMappings(ts, sourceText, here);
writeFileSync(outputPath, code);

console.log('=== INPUT (example.input.ts) ===\n');
console.log(sourceText);
console.log('=== OUTPUT (example.output.ts) — transformed ===\n');
console.log(code);

const program = ts.createProgram([outputPath], getCompilerOptions(ts));
const checker = program.getTypeChecker();
const out = program.getSourceFile(outputPath);
console.log('=== INFERRED TYPES of the output (propagation proof) ===\n');
out.forEachChild(function walk(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    console.log(`  ${node.name.text}: ${checker.typeToString(checker.getTypeAtLocation(node.name))}`);
  }
  node.forEachChild(walk);
});
const diagnostics = ts.getPreEmitDiagnostics(program).filter(d => d.file && d.file.fileName === out.fileName);
console.log('');
console.log(diagnostics.length === 0 ? 'Output type-checks with NO errors. ✔'
  : `Output has ${diagnostics.length} type error(s). ✘`);
