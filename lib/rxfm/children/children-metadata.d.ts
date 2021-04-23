export declare class ChildrenMetadata {
    blocks: {
        symbol: symbol;
        length: number;
    }[];
    center: number;
}
export declare function registerChildrenBlockMetadata(currentMetadata: ChildrenMetadata, blockSymbol: symbol, end: boolean): ChildrenMetadata;
export declare function addChildrenToMetadata(currentMetadata: ChildrenMetadata, blockSymbol: symbol, end?: boolean, childrenLength?: number): {
    newMetadata: ChildrenMetadata;
    insertBeforeIndex: number;
};
export declare function removeChildrenFromMetadata(currentMetadata: ChildrenMetadata, blockSymbol: symbol, childrenLength: number): ChildrenMetadata;
