// Verifies the `? : EMPTY` filter idiom + the stall detection (C1).
// Run: node tsrx/empty-filter.mjs
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(here, 'examples');

const src = `
import { Observable, EMPTY } from "rxjs";
declare const score: Observable<number>;
const big = score > 10 ? score : EMPTY;      // filter idiom → maybe-empty
const labelled = score > 5 ? "hi" : EMPTY;   // filter + map → maybe-empty
const safe = score > 10 ? score : 0;         // total ternary → NOT maybe-empty
const stallsHere = big + 1;                  // combine over maybe-empty → STALL
const fine = safe + 1;                       // combine over total → no stall
const childOnly = big;                       // standalone use → no stall
`;

const { code, stalls } = transformWithMappings(ts, src, examplesDir);

let ok = true;
const check = (name, cond) => { console.log(`  ${cond ? '✔' : '✘'} ${name}`); ok = ok && cond; };

check('cond ? x : EMPTY lifts (filter idiom)', code.includes('? score : EMPTY'));
check('stall recorded for `big + 1` (combine over maybe-empty)', stalls.some(s => s.name === 'big'));
check('no stall for `safe + 1` (total ternary)', !stalls.some(s => s.name === 'safe'));
check('standalone `const childOnly = big` is not a stall', stalls.length === 1);
check('stall span points at the `big` operand', src.slice(stalls[0].start, stalls[0].start + stalls[0].length) === 'big');

// The plugin surfaces stalls as editor warnings: exercise stallDiagnostics with a
// minimal mock host (the only piece it needs is getScriptSnapshot).
const { stallDiagnostics } = await import('./ts-plugin/index.cjs');
const mockInfo = { languageServiceHost: { getScriptSnapshot: () => ts.ScriptSnapshot.fromString(src) } };
const warnings = stallDiagnostics(ts, mockInfo, join(examplesDir, 'x.tsrx'), undefined);
check('plugin emits one Warning diagnostic', warnings.length === 1 && warnings[0].category === ts.DiagnosticCategory.Warning);
check('warning message names the binding', warnings[0] && /'big' can be empty/.test(warnings[0].messageText));
check('warning span matches the source operand', warnings[0] && src.slice(warnings[0].start, warnings[0].start + warnings[0].length) === 'big');

console.log(stalls.length ? `\nstalls: ${JSON.stringify(stalls.map(s => s.name))}` : '');
console.log(ok ? '\nAll EMPTY-filter checks passed.' : '\nSome checks failed.');
process.exit(ok ? 0 : 1);
