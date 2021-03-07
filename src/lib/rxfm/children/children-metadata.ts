export class ChildrenMetadata {
  public blocks: { symbol: symbol, length: number }[] = [];
  public center = 0;
}

export function registerChildrenBlockMetadata(
  currentMetadata: ChildrenMetadata,
  blockSymbol: symbol,
  end: boolean,
): ChildrenMetadata {
  const exists = currentMetadata.blocks.some((({ symbol }) => symbol === blockSymbol));
  if (!exists) {
    const blocks = [
      ...currentMetadata.blocks.slice(0, currentMetadata.center),
      { symbol: blockSymbol, length: 0 },
      ...currentMetadata.blocks.slice(currentMetadata.center),
    ];
    const center = end ? currentMetadata.center + 1 : currentMetadata.center;
    return { blocks, center };
  }
  return currentMetadata;
}

export function addChildrenToMetadata(
  currentMetadata: ChildrenMetadata,
  blockSymbol: symbol,
  end = false,
  childrenLength = 1,
): { newMetadata: ChildrenMetadata, insertBeforeIndex: number } {
  // Add block if it's not yet present.
  let newMetadata = registerChildrenBlockMetadata(currentMetadata, blockSymbol, end);

  // Clone metadata.
  newMetadata = newMetadata === currentMetadata ? { blocks: [...newMetadata.blocks], center: newMetadata.center } : newMetadata;

  // Find index of our block.
  const index = currentMetadata.blocks.findIndex((({ symbol }) => symbol === blockSymbol));

  // Find element to insert before if available.
  const insertBeforeIndex = newMetadata.blocks.slice(0, index + 1).reduce((count, { length }) => count + length, 0);

  // Update metadata by incrementing block length by element(s) length
  const newBlock = { symbol: blockSymbol, length: newMetadata.blocks[index].length + childrenLength };
  newMetadata.blocks[index] = newBlock;

  return { newMetadata, insertBeforeIndex };
}

export function removeChildrenFromMetadata(
  currentMetadata: ChildrenMetadata,
  blockSymbol: symbol,
  childrenLength: number,
): ChildrenMetadata {
  const blockIndex = currentMetadata.blocks.findIndex(({ symbol }) => blockSymbol === symbol);
  const block = currentMetadata.blocks[blockIndex];
  if (block) { // If block exists, decrement block length.
    const newBlocks = [...currentMetadata.blocks];
    newBlocks[blockIndex] = { ...block, length: Math.max(0, block.length - childrenLength) };
    return { ...currentMetadata, blocks: newBlocks };
  }
  return currentMetadata;
}
