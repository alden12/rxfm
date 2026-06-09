// Reactive TS transform fixture suite (ROADMAP B2).
//
// Each case under cases/<name>/ is:
//   input.rts   — source fed to the transform
//   expected.ts  — the FULL generated output (the behavioural snapshot)
//   meta.json    — expected diagnostics / stalls / higher-order spans / hovers
//
// The full-output snapshot is the safety net for the readability refactor: any
// change to what the transform emits shows up as a diff here. Diagnostics, stalls,
// higher-order warnings and hover types are asserted from meta.json (authored — they
// encode intent), while expected.ts is captured: run `UPDATE_FIXTURES=1 yarn test`
// to (re)generate every expected.ts, then review the diff.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { run } = require('./harness.cjs');

const CASES_DIR = path.join(__dirname, 'cases');
const UPDATE = process.env.UPDATE_FIXTURES === '1';

const cases = fs.readdirSync(CASES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

describe('Reactive TS transform fixtures', () => {
  for (const name of cases) {
    const dir = path.join(CASES_DIR, name);
    const inputPath = path.join(dir, 'input.rts');
    const expectedPath = path.join(dir, 'expected.ts');
    const metaPath = path.join(dir, 'meta.json');

    const source = fs.readFileSync(inputPath, 'utf8');
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
    const baseDir = meta.baseDir ? path.resolve(dir, meta.baseDir) : undefined;

    describe(name, () => {
      const r = run(source, baseDir);

      if (UPDATE) {
        // Capture mode: write the generated output as the new baseline.
        it('captures expected.ts', () => {
          fs.writeFileSync(expectedPath, r.code);
        });
        return;
      }

      it('matches expected.ts', () => {
        const expected = fs.readFileSync(expectedPath, 'utf8');
        expect(r.code).toBe(expected);
      });

      it('produces the expected output diagnostics', () => {
        const want = meta.diagnostics || [];
        const got = r.diagnostics();
        // Compare on (code, category, message) — the fields meta records.
        expect(got).toMatchObject(want);
        expect(got.length).toBe(want.length);
      });

      it('records the expected stalls', () => {
        const want = meta.stalls || [];
        const got = r.stalls.map(s => ({ name: s.name }));
        expect(got).toEqual(want.map(s => ({ name: s.name })));
      });

      it('records the expected higher-order lifts', () => {
        const want = meta.higherOrder || [];
        const got = r.higherOrder.map(h => ({ name: h.name }));
        expect(got).toEqual(want.map(h => ({ name: h.name })));
      });

      for (const want of meta.boundaryRewrites || []) {
        it(`boundary rewrite → ${want.headline}`, () => {
          const got = r.boundaryRewrites();
          const match = got.find(g => g.headline.includes(want.headline));
          expect(match).toBeDefined();
          if (want.original) expect(match.original).toContain(want.original);
        });
      }

      for (const h of meta.hovers || []) {
        it(`hover ${h.find}${h.token ? ` @${h.token}` : ''} → ${h.expect}`, () => {
          const base = source.indexOf(h.find);
          expect(base).toBeGreaterThanOrEqual(0);
          const offset = base + (h.token ? h.find.lastIndexOf(h.token) : 0);
          const type = r.hoverAtSource(offset);
          expect(type).not.toBeNull();
          expect(type).toContain(h.expect);
        });
      }
    });
  }
});
