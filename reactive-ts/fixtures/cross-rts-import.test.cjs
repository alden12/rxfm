// Regression: a relative import that INCLUDES the `.rts` extension (`./routes.rts`, the
// convention a `.ts` file uses to import a `.rts` one) must resolve in the transform's
// type program — otherwise the imported symbols collapse to `any` and any lift that
// keys off their types silently degrades. The original bug: the fallback resolver
// appended `.rts` unconditionally, turning `./routes.rts` into `routes.rts.rts`, so a
// `Record<string, Component>` lookup lifted to a non-flattening `map` and leaked a
// higher-order Observable<Observable<HTMLElement>> straight into the DOM.
//
// We assert on the transform OUTPUT directly (not via the harness's output type-check,
// which doesn't resolve `.rts`), so resolution is the only thing under test.
'use strict';
const ts = require('typescript');
const path = require('node:path');
const { transformWithMappings } = require('../ts-plugin/transform.cjs');

const DIR = path.join(__dirname, 'cross-rts');
const transform = src => transformWithMappings(ts, src, DIR).code;

const consumer = table =>
  [
    "import { Observable } from 'rxjs';",
    `import { ROUTES } from '${table}';`,
    'declare const key: Observable<string>;',
    'export const picked = ROUTES[key];',
  ].join('\n');

describe('cross-.rts import resolution (explicit .rts specifier)', () => {
  test('observable-valued table → flattens via switchMap + coerceToObservable', () => {
    const out = transform(consumer('./routes-observable.rts'));
    expect(out).toContain('switchMap(');
    expect(out).toContain('coerceToObservable(');
  });

  test('plain-valued table → tight map (proves the import resolved to its real type)', () => {
    // If `./routes-plain.rts` had failed to resolve, ROUTES would be `any` and the
    // defensive "flatten when unprovable" rule would switchMap. A tight `map` here can
    // ONLY happen if resolution succeeded and the real `number` value type was seen.
    const out = transform(consumer('./routes-plain.rts'));
    expect(out).toContain('.pipe(map(');
    expect(out).not.toContain('switchMap(');
    expect(out).not.toContain('coerceToObservable(');
  });
});
