export declare type MinesweeperCellType = 'cleared' | 'unflaggedEmpty' | 'unflaggedMine' | 'flaggedMine' | 'flaggedEmpty' | 'explodedMine' | 'mine';
export declare type GameStage = 'pregame' | 'playing' | 'gameOver' | 'win';
export declare type Vector = [number, number];
export declare type CellActionType = 'discover' | 'flag' | 'start';
export interface CellAction {
    type: CellActionType;
    cell: Vector;
}
