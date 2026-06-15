// Plugin-layer surfacing tests — the half NOT covered by the transform fixtures.
//
// The fixture suite locks what the TRANSFORM produces (output, stalls, higher-order
// spans). This locks how the tsserver PLUGIN (index.cjs) turns those side-channel
// signals into editor Warning diagnostics, plus the editor-path quirk that the
// warnings must survive even when the host serves GENERATED code (Volar's snapshot
// for a .rts path), by reusing the LanguagePlugin's source-derived cache.
//
// Sources are the same .rts inputs the fixtures use, read from disk.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { stallDiagnostics, higherOrderDiagnostics, augmentObservableOperatorCompletions } = require('../ts-plugin/index.cjs');
const { createReactiveTsLanguagePlugin } = require('../ts-plugin/language-plugin.cjs');
const { transformWithMappings } = require('../ts-plugin/transform.cjs');

const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');
const readCase = name => fs.readFileSync(path.join(__dirname, 'cases', name, 'input.rts'), 'utf8');

// A minimal tsserver-plugin `info` whose host serves `text` for any snapshot.
const mockInfo = text => ({
  languageServiceHost: { getScriptSnapshot: () => ts.ScriptSnapshot.fromString(text) },
});
const spanText = (src, d) => src.slice(d.start, d.start + d.length);

describe('plugin: stall warnings', () => {
  const src = readCase('empty-filter');
  const fileName = path.join(EXAMPLES_DIR, 'x.rts');
  const warnings = stallDiagnostics(ts, mockInfo(src), fileName, undefined);

  it('emits exactly one Warning', () => {
    expect(warnings).toHaveLength(1);
    expect(warnings[0].category).toBe(ts.DiagnosticCategory.Warning);
  });
  it('names the maybe-empty binding', () => {
    expect(warnings[0].messageText).toMatch(/'big' can be empty/);
  });
  it('spans the source operand', () => {
    expect(spanText(src, warnings[0])).toBe('big');
  });
});

describe('plugin: higher-order warnings', () => {
  const src = readCase('higher-order');
  const fileName = path.join(EXAMPLES_DIR, 'x.rts');
  const warnings = higherOrderDiagnostics(ts, mockInfo(src), fileName, undefined);

  it('emits exactly one Warning', () => {
    expect(warnings).toHaveLength(1);
    expect(warnings[0].category).toBe(ts.DiagnosticCategory.Warning);
  });
  it('explains the stream-of-streams and points at a flattening helper', () => {
    expect(warnings[0].messageText).toMatch(/stream-of-streams/);
    expect(warnings[0].messageText).toMatch(/interval/);
  });
  it('spans the source call', () => {
    expect(spanText(src, warnings[0])).toBe('timer(0, period)');
  });

  // Editor-path regression: in the live editor the host's snapshot for a .rts path
  // is the GENERATED TS (Volar's getServiceScript), so re-transforming it finds none
  // of the source-level patterns. The plugin must instead reuse the result the
  // LanguagePlugin computed from the ORIGINAL source. Prime that cache, then feed the
  // diagnostic the generated code as the host snapshot and confirm it still fires.
  it('surfaces via the LanguagePlugin cache when the host serves generated code', () => {
    const { code } = transformWithMappings(ts, src, EXAMPLES_DIR);
    const lp = createReactiveTsLanguagePlugin(ts);
    lp.createVirtualCode(fileName, 'rts', ts.ScriptSnapshot.fromString(src)); // caches from source
    const editorWarnings = higherOrderDiagnostics(ts, mockInfo(code), fileName, undefined);
    expect(editorWarnings).toHaveLength(1);
    expect(spanText(src, editorWarnings[0])).toBe('timer(0, period)');
  });
});

describe('plugin: observable operator completions', () => {
  // `nums.x` lifts (member access over an observable), so the completion at `nums.|`
  // otherwise resolves against the emitted `number`. The plugin must merge the stream
  // operators back in.
  const src = 'import { Observable } from "rxjs";\ndeclare const nums: Observable<number>;\nconst d = nums.x;';
  // Distinct fileName: the stall/higher-order suites prime the LanguagePlugin cache for
  // `x.rts`, and reactiveTsTransformFor prefers that cache — a shared name would feed this
  // the wrong source's spans.
  const fileName = path.join(EXAMPLES_DIR, 'completions.rts');
  const at = src.indexOf('nums.x') + 'nums.'.length; // cursor just after the dot
  const PASS_THROUGH = ['scan', 'take', 'drop', 'takeUntil', 'catch', 'finally', 'debounce', 'throttle'];

  it('appends the pass-through operators inside an observable-member span', () => {
    const base = { entries: [{ name: 'toFixed' }, { name: 'toString' }] };
    const out = augmentObservableOperatorCompletions(ts, mockInfo(src), fileName, at, base);
    const names = out.entries.map(e => e.name);
    expect(names).toEqual(expect.arrayContaining(PASS_THROUGH));
    expect(names).toContain('toFixed'); // emitted-value members are preserved
  });

  it('does not offer map/filter/flatMap (those are the .rts list/element idioms)', () => {
    const out = augmentObservableOperatorCompletions(ts, mockInfo(src), fileName, at, { entries: [] });
    const names = out.entries.map(e => e.name);
    expect(names).not.toContain('map');
    expect(names).not.toContain('filter');
    expect(names).not.toContain('flatMap');
  });

  it('marks the operators as a stream operator and as methods', () => {
    const out = augmentObservableOperatorCompletions(ts, mockInfo(src), fileName, at, { entries: [] });
    const scan = out.entries.find(e => e.name === 'scan');
    expect(scan.kind).toBe(ts.ScriptElementKind.memberFunctionElement);
    expect(scan.labelDetails.description).toBe('stream operator');
  });

  it('leaves completions untouched outside any observable-member span', () => {
    const base = { entries: [{ name: 'foo' }] };
    const out = augmentObservableOperatorCompletions(ts, mockInfo(src), fileName, 0, base);
    expect(out.entries.map(e => e.name)).toEqual(['foo']);
  });
});
