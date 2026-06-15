import {
  ChildrenBlockMetadata,
  registerChildrenBlockMetadata,
  addChildrenToMetadata,
  removeChildrenFromMetadata,
} from './children-operator-isolation';

const a = Symbol('a');
const b = Symbol('b');
const c = Symbol('c');

describe('registerChildrenBlockMetadata', () => {
  it('prepends a start-aligned block', () => {
    const existing: ChildrenBlockMetadata[] = [{ symbol: a, length: 1 }];
    expect(registerChildrenBlockMetadata(existing, b, false)).toEqual([
      { symbol: b, length: 0 },
      { symbol: a, length: 1 },
    ]);
  });

  it('appends an end-aligned block', () => {
    const existing: ChildrenBlockMetadata[] = [{ symbol: a, length: 1 }];
    expect(registerChildrenBlockMetadata(existing, b, true)).toEqual([
      { symbol: a, length: 1 },
      { symbol: b, length: 0 },
    ]);
  });

  it('returns the same array reference when the block already exists', () => {
    const existing: ChildrenBlockMetadata[] = [{ symbol: a, length: 1 }];
    expect(registerChildrenBlockMetadata(existing, a, false)).toBe(existing);
  });
});

describe('addChildrenToMetadata', () => {
  it('increments the target block length and returns the index just past its existing children', () => {
    const metadata: ChildrenBlockMetadata[] = [
      { symbol: a, length: 2 },
      { symbol: b, length: 3 },
    ];
    const { newMetadata, insertBeforeIndex } = addChildrenToMetadata(metadata, a);
    expect(newMetadata).toEqual([
      { symbol: a, length: 3 },
      { symbol: b, length: 3 },
    ]);
    expect(insertBeforeIndex).toBe(2); // Block a's 2 existing children occupy 0,1 → insert at 2.
  });

  it('offsets the insertion index by the lengths of all preceding blocks', () => {
    const metadata: ChildrenBlockMetadata[] = [
      { symbol: a, length: 2 },
      { symbol: b, length: 3 },
    ];
    const { insertBeforeIndex } = addChildrenToMetadata(metadata, b);
    expect(insertBeforeIndex).toBe(5); // 2 (block a) + 3 (block b's existing) → append at 5.
  });

  it('adds multiple children at once', () => {
    const metadata: ChildrenBlockMetadata[] = [{ symbol: a, length: 0 }];
    const { newMetadata, insertBeforeIndex } = addChildrenToMetadata(metadata, a, false, 4);
    expect(newMetadata).toEqual([{ symbol: a, length: 4 }]);
    expect(insertBeforeIndex).toBe(0); // Empty block → first child goes at index 0.
  });

  it('does not mutate the input metadata', () => {
    const metadata: ChildrenBlockMetadata[] = [{ symbol: a, length: 2 }];
    addChildrenToMetadata(metadata, a);
    expect(metadata).toEqual([{ symbol: a, length: 2 }]);
  });

  // Regression: previously the block index was taken from currentMetadata, so a block registered
  // inside this call (absent from currentMetadata) produced index -1 and threw.
  it('handles a block that is only registered within the call', () => {
    const metadata: ChildrenBlockMetadata[] = [{ symbol: a, length: 1 }];
    const { newMetadata, insertBeforeIndex } = addChildrenToMetadata(metadata, b, false);
    expect(newMetadata).toEqual([
      { symbol: b, length: 1 },
      { symbol: a, length: 1 },
    ]);
    expect(insertBeforeIndex).toBe(0); // start-aligned new block: its child goes at the front.
  });
});

describe('removeChildrenFromMetadata', () => {
  it('decrements the target block length', () => {
    const metadata: ChildrenBlockMetadata[] = [{ symbol: a, length: 3 }];
    expect(removeChildrenFromMetadata(metadata, a, 2)).toEqual([{ symbol: a, length: 1 }]);
  });

  it('never decrements below zero', () => {
    const metadata: ChildrenBlockMetadata[] = [{ symbol: a, length: 1 }];
    expect(removeChildrenFromMetadata(metadata, a, 5)).toEqual([{ symbol: a, length: 0 }]);
  });

  it('returns the metadata unchanged when the block is absent', () => {
    const metadata: ChildrenBlockMetadata[] = [{ symbol: a, length: 1 }];
    expect(removeChildrenFromMetadata(metadata, c, 1)).toBe(metadata);
  });

  it('does not mutate the input metadata', () => {
    const metadata: ChildrenBlockMetadata[] = [{ symbol: a, length: 3 }];
    removeChildrenFromMetadata(metadata, a, 1);
    expect(metadata).toEqual([{ symbol: a, length: 3 }]);
  });
});
