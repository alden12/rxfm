/**
 * Metadata for the 'block' of child elements added to a component by a single instance of the children operator.
 */
export interface ChildrenBlockMetadata {
  /**
   * The symbol representing the instance of the children operator.
   */
  symbol: symbol;
  /**
   * The number of children which have been added to the parent element by the instance of the children operator.
   */
  length: number;
}

/**
 * Add a new instance of the children operator to a component's children metadata.
 * @param currentMetadata The current children metadata of the component.
 * @param blockSymbol The symbol representing the new children operator.
 * @param end Whether or not the block should be end aligned.
 * @returns The new metadata with a new children block added.
 */
export function registerChildrenBlockMetadata(
  currentMetadata: ChildrenBlockMetadata[],
  blockSymbol: symbol,
  end: boolean,
): ChildrenBlockMetadata[] {
  const exists = currentMetadata.some((({ symbol }) => symbol === blockSymbol));
  if (!exists) { // If the block is not already present.
    const newBlock = { symbol: blockSymbol, length: 0 }; // Create a new block.
    // Add the block to the beginning or end of the blocks array depending on whether it should be end aligned. Operators are
    // added in reverse order so the earliest instances of children or lastChildren will end up at the start or end respectively.
    return end ? [...currentMetadata, newBlock] : [newBlock, ...currentMetadata];
  }
  return currentMetadata;
}

/**
 * Add child elements to the children operators metadata of a component.
 * @param currentMetadata The current children metadata of the component.
 * @param blockSymbol The symbol representing the children operator.
 * @param end Whether or not the block should be end aligned.
 * @param childrenLength The number of child elements to be added, default is 1.
 * @returns The new metadata with the new children added to their appropriate block.
 */
export function addChildrenToMetadata(
  currentMetadata: ChildrenBlockMetadata[],
  blockSymbol: symbol,
  end = false,
  childrenLength = 1,
): { newMetadata: ChildrenBlockMetadata[], insertBeforeIndex: number } {
  // Add block if it's not yet present.
  let newMetadata = registerChildrenBlockMetadata(currentMetadata, blockSymbol, end);
  // Clone metadata if it was not already.
  newMetadata = newMetadata === currentMetadata ? [...newMetadata] : newMetadata;
  // Find index of our block.
  const index = currentMetadata.findIndex((({ symbol }) => symbol === blockSymbol));
  // Find element to insert before if available.
  const insertBeforeIndex = newMetadata.slice(0, index + 1).reduce((count, { length }) => count + length, 0);
  // Update metadata by incrementing the block length by the number of added elements.
  const newBlock = { symbol: blockSymbol, length: newMetadata[index].length + childrenLength };
  newMetadata[index] = newBlock;

  return { newMetadata, insertBeforeIndex };
}

/**
 * Remove child elements from the children operators metadata of a component.
 * @param currentMetadata The current children metadata of the component.
 * @param blockSymbol The symbol representing the children operator.
 * @param childrenLength The number of child elements to be removed.
 * @returns The new metadata with the new children removed from their appropriate block.
 */
export function removeChildrenFromMetadata(
  currentMetadata: ChildrenBlockMetadata[],
  blockSymbol: symbol,
  childrenLength: number,
): ChildrenBlockMetadata[] {
  const blockIndex = currentMetadata.findIndex(({ symbol }) => blockSymbol === symbol);
  const block = currentMetadata[blockIndex];
  if (block) { // If block exists, decrement block length.
    const newBlocks = [...currentMetadata];
    newBlocks[blockIndex] = { ...block, length: Math.max(0, block.length - childrenLength) };
    return newBlocks;
  }
  return currentMetadata;
}
