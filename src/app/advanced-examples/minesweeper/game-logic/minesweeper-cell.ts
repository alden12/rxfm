import { isOneOf, CELL_COLOR_MAP, CELL_SYMBOL_MAP, CELL_FLAG_TOGGLE_MAP } from "../constants";
import { MinesweeperCellType } from "../types";

export class MinesweeperCell {
  constructor(
    private type: MinesweeperCellType = 'unflaggedEmpty',
    public neighbors = 0,
  ) {}

  public get isMine(): boolean {
    return isOneOf<MinesweeperCellType>(this.type, ['unflaggedMine', 'flaggedMine']);
  }

  public get isFlagged(): boolean {
    return isOneOf<MinesweeperCellType>(this.type, ['flaggedEmpty', 'flaggedMine']);
  }

  public get isCleared(): boolean {
    return this.type === 'cleared';
  }

  public get isUnflaggedEmpty(): boolean {
    return this.type === 'unflaggedEmpty';
  }

  public get isUnflaggedMine(): boolean {
    return this.type === 'unflaggedMine';
  }

  public get hasNeighbors(): boolean {
    return this.neighbors > 0;
  }

  public get color(): string {
    return CELL_COLOR_MAP[this.type];
  }

  public get symbol(): string | undefined {
    return CELL_SYMBOL_MAP[this.type];
  }

  public updateType(newType: MinesweeperCellType): MinesweeperCell {
    return new MinesweeperCell(newType, this.neighbors);
  }

  public updateNeighbors(neighbors: number): MinesweeperCell {
    return new MinesweeperCell(this.type, neighbors);
  }

  public clear() {
    return new MinesweeperCell('cleared', this.neighbors);
  }

  public toggleFlagged(): MinesweeperCell {
    const newType = CELL_FLAG_TOGGLE_MAP[this.type];
    return newType ? this.updateType(newType) : this;
  }
}
