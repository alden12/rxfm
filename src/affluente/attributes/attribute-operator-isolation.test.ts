import { AttributeMetadataDictionary, setAttributes } from './attribute-operator-isolation';

type Calls = [string, string | null][];

/** A setAttribute spy plus a fresh metadata map. */
function setup() {
  const calls: Calls = [];
  const metadata = new Map<symbol, AttributeMetadataDictionary<string>>();
  const setAttribute = (name: string, value: string | null) => { calls.push([name, value]); };
  return { calls, metadata, setAttribute };
}

describe('setAttributes', () => {
  it('sets a string attribute and records it in the metadata map', () => {
    const { calls, metadata, setAttribute } = setup();
    const symbol = Symbol();
    setAttributes(setAttribute, metadata, symbol, { id: 'x' });
    expect(calls).toEqual([['id', 'x']]);
    expect(metadata.get(symbol)).toEqual({ id: 'x' });
  });

  it('coerces booleans to "" / null and other values to strings', () => {
    const { calls, metadata, setAttribute } = setup();
    const mixed: Record<string, unknown> = { a: true, b: false, c: 0, d: null };
    setAttributes(setAttribute, metadata, Symbol(), mixed);
    expect(calls).toEqual([
      ['a', ''],     // boolean true → present with empty value
      ['b', null],   // boolean false → removed
      ['c', '0'],    // number → string
      ['d', null],   // explicit null → removed
    ]);
  });

  it('nulls out attributes removed since the previous object', () => {
    const { calls, metadata, setAttribute } = setup();
    const symbol = Symbol();
    setAttributes(setAttribute, metadata, symbol, { a: '1', b: '2' });
    calls.length = 0;
    setAttributes(setAttribute, metadata, symbol, { a: '1' }, { a: '1', b: '2' }); // b dropped
    expect(calls).toEqual(expect.arrayContaining([['a', '1'], ['b', null]]));
    expect(metadata.get(symbol)).toEqual({ a: '1', b: null });
  });

  it('lets the earliest operator win when several set the same attribute', () => {
    const { calls, metadata, setAttribute } = setup();
    const first = Symbol('first');
    const second = Symbol('second');
    setAttributes(setAttribute, metadata, first, { color: 'red' });
    calls.length = 0;
    setAttributes(setAttribute, metadata, second, { color: 'blue' });
    expect(calls).toEqual([['color', 'red']]); // first operator (inserted first) keeps priority
  });

  it('falls through to a lower-priority operator when the winner removes its value', () => {
    const { calls, metadata, setAttribute } = setup();
    const first = Symbol('first');
    const second = Symbol('second');
    setAttributes(setAttribute, metadata, first, { color: 'red' });
    setAttributes(setAttribute, metadata, second, { color: 'blue' });
    calls.length = 0;
    setAttributes(setAttribute, metadata, first, {}, { color: 'red' }); // first drops color
    expect(calls).toEqual([['color', 'blue']]); // second operator's value now shows through
  });
});
