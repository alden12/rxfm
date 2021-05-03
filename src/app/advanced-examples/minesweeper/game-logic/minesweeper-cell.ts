import { isOneOf, CELL_COLOR_MAP, CELL_SYMBOL_MAP, CELL_MARKING_MAP } from "../constants";
import { MinesweeperCellType } from "../types";

export class MinesweeperCell {
  constructor(
    private type: MinesweeperCellType = 'undiscoveredEmpty',
    public neighbors = 0,
  ) {}

  public get isMine(): boolean {
    return isOneOf<MinesweeperCellType>(this.type, ['undiscoveredMine', 'markedMine']);
  }

  public get isDiscovered(): boolean {
    return this.type === 'cleared';
  }

  public get isUndiscoveredEmpty(): boolean {
    return this.type === 'undiscoveredEmpty';
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

  public toggleMarked(): MinesweeperCell {
    const newType = CELL_MARKING_MAP[this.type];
    return newType ? this.updateType(newType) : this;
  }
}
