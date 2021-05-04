import { MinesweeperCellType } from "../types";
export declare class MinesweeperCell {
    private type;
    neighbors: number;
    constructor(type?: MinesweeperCellType, neighbors?: number);
    get isMine(): boolean;
    get isFlagged(): boolean;
    get isCleared(): boolean;
    get isUnflaggedEmpty(): boolean;
    get isUnflaggedMine(): boolean;
    get isUndiscovered(): boolean;
    get hasNeighbors(): boolean;
    get color(): string;
    get symbol(): string | undefined;
    updateType(newType: MinesweeperCellType): MinesweeperCell;
    updateNeighbors(neighbors: number): MinesweeperCell;
    clear(): MinesweeperCell;
    toggleFlagged(): MinesweeperCell;
}
