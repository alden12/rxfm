// Plugin-layer surfacing tests — the half NOT covered by the transform fixtures.
//
// The fixture suite locks what the TRANSFORM produces (output, stalls, higher-order
// spans). This locks how the tsserver PLUGIN (index.cjs) turns those side-channel
// signals into editor Warning diagnostics, plus the editor-path quirk that the
// warnings must survive even when the host serves GENERATED code (Volar's snapshot
// for a .tsrx path), by reusing the LanguagePlugin's source-derived cache.
//
// Sources are the same .tsrx inputs the fixtures use, read from disk.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { stallDiagnostics, higherOrderDiagnostics } = require('../ts-plugin/index.cjs');
const { createTsrxLanguagePlugin } = require('../ts-plugin/language-plugin.cjs');
const { transformWithMappings } = require('../ts-plugin/transform.cjs');

const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');
const readCase = name => fs.readFileSync(path.join(__dirname, 'cases', name, 'input.tsrx'), 'utf8');

// A minimal tsserver-plugin `info` whose host serves `text` for any snapshot.
const mockInfo = text => ({
  languageServiceHost: { getScriptSnapshot: () => ts.ScriptSnapshot.fromString(text) },
});
const spanText = (src, d) => src.slice(d.start, d.start + d.length);

describe('plugin: stall warnings', () => {
  const src = readCase('empty-filter');
  const fileName = path.join(EXAMPLES_DIR, 'x.tsrx');
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
  const fileName = path.join(EXAMPLES_DIR, 'x.tsrx');
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

  // Editor-path regression: in the live editor the host's snapshot for a .tsrx path
  // is the GENERATED TS (Volar's getServiceScript), so re-transforming it finds none
  // of the source-level patterns. The plugin must instead reuse the result the
  // LanguagePlugin computed from the ORIGINAL source. Prime that cache, then feed the
  // diagnostic the generated code as the host snapshot and confirm it still fires.
  it('surfaces via the LanguagePlugin cache when the host serves generated code', () => {
    const { code } = transformWithMappings(ts, src, EXAMPLES_DIR);
    const lp = createTsrxLanguagePlugin(ts);
    lp.createVirtualCode(fileName, 'tsrx', ts.ScriptSnapshot.fromString(src)); // caches from source
    const editorWarnings = higherOrderDiagnostics(ts, mockInfo(code), fileName, undefined);
    expect(editorWarnings).toHaveLength(1);
    expect(spanText(src, editorWarnings[0])).toBe('timer(0, period)');
  });
});
