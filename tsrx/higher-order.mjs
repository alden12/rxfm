// Verifies the higher-order-lift warning. Lifting a call whose function itself
// returns an observable (e.g. `timer(0, period)` over an observable period) maps
// over the lifted arg and yields Observable<Observable<…>> — a stream of streams
// that never flattens, so it won't behave as one reactive value. It type-checks,
// so TS stays silent; the transform records the span and the plugin surfaces a
// Warning. The `interval` helper (operator-style, flattens with switchMap inside)
// must NOT warn — it's the correct tool for a re-timing clock.
// Run: node tsrx/higher-order.mjs
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import transformCjs from './ts-plugin/transform.cjs';

const { transformWithMappings } = transformCjs;
const here = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(here, 'examples');

const src = `
import { timer, Observable } from "rxjs";
import { interval } from "../runtime";
declare const period: Observable<number>;
const trap = timer(0, period);     // higher-order: timer returns Observable → nested
const clock = interval(period);    // helper: operator-style, flattens → fine
const ms = 1000;
const plain = timer(0, ms);        // plain-number arg → not lifted → fine
`;

const { code, higherOrder } = transformWithMappings(ts, src, examplesDir);
const span = h => src.slice(h.start, h.start + h.length);

let ok = true;
const check = (name, cond) => { console.log(`  ${cond ? '✔' : '✘'} ${name}`); ok = ok && cond; };

check('timer(0, period) lifts to a nested combineLatest+map', code.includes('map(([period]) => timer(0, period))'));
check('exactly one higher-order span recorded', higherOrder.length === 1);
check('it is the `timer(0, period)` call', higherOrder.length === 1 && higherOrder[0].name === 'timer' && span(higherOrder[0]) === 'timer(0, period)');
check('interval(period) is left as an operator-style call (not flagged)', code.includes('interval(period)'));
check('timer(0, ms) over a plain number is not flagged', !higherOrder.some(h => span(h) === 'timer(0, ms)'));

// The plugin surfaces it as an editor Warning (mirrors the stall surfacing).
const { higherOrderDiagnostics } = await import('./ts-plugin/index.cjs');
const mockInfo = { languageServiceHost: { getScriptSnapshot: () => ts.ScriptSnapshot.fromString(src) } };
const warnings = higherOrderDiagnostics(ts, mockInfo, join(examplesDir, 'x.tsrx'), undefined);
check('plugin emits one Warning diagnostic', warnings.length === 1 && warnings[0].category === ts.DiagnosticCategory.Warning);
check('message explains the stream-of-streams + points at a flattening helper', warnings[0] && /stream-of-streams/.test(warnings[0].messageText) && /interval/.test(warnings[0].messageText));
check('warning span matches the source call', warnings[0] && src.slice(warnings[0].start, warnings[0].start + warnings[0].length) === 'timer(0, period)');

// Editor-path regression: in the live editor the decorated host's snapshot for a
// .tsrx path is the GENERATED TS (Volar's getServiceScript), not the source — so
// re-transforming it finds nothing. The plugin must instead reuse the result the
// LanguagePlugin computed from the ORIGINAL source. Populate that cache, then feed
// the diagnostic the generated code as the host snapshot and confirm it still fires.
const { createTsrxLanguagePlugin } = await import('./ts-plugin/language-plugin.cjs');
const lp = createTsrxLanguagePlugin(ts);
const tsrxPath = join(examplesDir, 'x.tsrx');
lp.createVirtualCode(tsrxPath, 'tsrx', ts.ScriptSnapshot.fromString(src)); // caches from source
const editorInfo = { languageServiceHost: { getScriptSnapshot: () => ts.ScriptSnapshot.fromString(code) } };
const editorWarnings = higherOrderDiagnostics(ts, editorInfo, tsrxPath, undefined);
check('surfaces via the LanguagePlugin cache when the host serves generated code',
  editorWarnings.length === 1 && src.slice(editorWarnings[0].start, editorWarnings[0].start + editorWarnings[0].length) === 'timer(0, period)');

console.log(higherOrder.length ? `\nhigher-order: ${JSON.stringify(higherOrder.map(h => span(h)))}` : '');
console.log(ok ? '\nAll higher-order checks passed.' : '\nSome checks failed.');
process.exit(ok ? 0 : 1);
