export type MinesweeperCellType =
  | 'cleared'
  | 'unflaggedEmpty'
  | 'unflaggedMine'
  | 'flaggedMine'
  | 'flaggedEmpty'
  | 'explodedMine'
  | 'mine';

export type GameStage = 'pregame' | 'playing' | 'gameOver' | 'win';

export type Vector = [number, number]; // [x, y]

export type CellActionType = 'discover' | 'flag' | 'start';

export interface CellAction {
  type: CellActionType;
  cell: Vector;
}
