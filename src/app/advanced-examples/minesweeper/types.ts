export type MinesweeperCellType = 'cleared' | 'undiscoveredEmpty' | 'undiscoveredMine' | 'markedMine' | 'markedEmpty' | 'explodedMine' | 'mine';

export type GameStage = 'pregame' | 'playing' | 'gameOver' | 'win';

export type Vector = [number, number]; // [x, y]

export type CellActionType = 'discover' | 'mark' | 'start';

export interface CellAction {
  type: CellActionType;
  cell: Vector;
}
