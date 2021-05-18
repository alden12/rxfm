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
export declare function registerChildrenBlockMetadata(currentMetadata: ChildrenBlockMetadata[], blockSymbol: symbol, end: boolean): ChildrenBlockMetadata[];
/**
 * Add child elements to the children operators metadata of a component.
 * @param currentMetadata The current children metadata of the component.
 * @param blockSymbol The symbol representing the children operator.
 * @param end Whether or not the block should be end aligned.
 * @param childrenLength The number of child elements to be added, default is 1.
 * @returns The new metadata with the new children added to their appropriate block.
 */
export declare function addChildrenToMetadata(currentMetadata: ChildrenBlockMetadata[], blockSymbol: symbol, end?: boolean, childrenLength?: number): {
    newMetadata: ChildrenBlockMetadata[];
    insertBeforeIndex: number;
};
/**
 * Remove child elements from the children operators metadata of a component.
 * @param currentMetadata The current children metadata of the component.
 * @param blockSymbol The symbol representing the children operator.
 * @param childrenLength The number of child elements to be removed.
 * @returns The new metadata with the new children removed from their appropriate block.
 */
export declare function removeChildrenFromMetadata(currentMetadata: ChildrenBlockMetadata[], blockSymbol: symbol, childrenLength: number): ChildrenBlockMetadata[];
