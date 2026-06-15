export type MinesweeperCellType =
  | "cleared"
  | "unflaggedEmpty"
  | "unflaggedMine"
  | "flaggedMine"
  | "flaggedEmpty"
  | "explodedMine"
  | "mine";

export type GameStage = "pregame" | "playing" | "gameOver" | "win";

export type Vector = [number, number]; // [x, y]

// Cell-targeting actions carry the cell they act on; 'restart' resets the game and
// so needs no cell. 'start' is internal — reduceGame rewrites the first cell click
// into it (see game-logic) — so the UI only ever dispatches 'discover'/'flag'/'restart'.
export type CellAction =
  | { type: "discover" | "flag" | "start"; cell: Vector }
  | { type: "restart" };
