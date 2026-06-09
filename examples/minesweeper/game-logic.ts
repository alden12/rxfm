// Pure domain logic for Minesweeper — no RxJS, no reactivity. The cell, the board
// operations, and the game state machine, all ordinary value code. The reactive
// wiring lives in game.rts; this module is just the rules.
//
// One change from the original RxJS version: restarting is modelled explicitly.
// The original threw an Error on a 'start' action and relied on `retry()` to
// resubscribe the `scan`, resetting the fold. Here `reduceGame` just resets when it
// sees a 'start' (or the very first action, from `pregame`) — an honest imperative
// reducer instead of control-flow-via-exceptions, which is what Reactive TS's
// `accumulate` wants.
import {
  NEIGHBOR_VECTORS, BOARD_WIDTH, BOARD_HEIGHT, MINE_COUNT,
  isOneOf, indexToVector, vectorToIndex,
  CELL_COLOR_MAP, CELL_SYMBOL_MAP, CELL_FLAG_TOGGLE_MAP,
} from "./constants";
import { MinesweeperCellType, Vector, GameStage, CellAction } from "./types";

// ---------------------------------------------------------------- Cell ----

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

  public get isUndiscovered(): boolean {
    return isOneOf<MinesweeperCellType>(this.type, ['flaggedEmpty', 'unflaggedEmpty', 'flaggedMine', 'unflaggedMine']);
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

// --------------------------------------------------------------- Board ----

export type MinesweeperBoard = MinesweeperCell[][];

interface OffsetCell {
  cell: MinesweeperCell;
  coords: Vector;
}

const getOffsetCell = (board: MinesweeperBoard, cellCoords: Vector, offset: Vector): OffsetCell | undefined => {
  const coords: Vector = [cellCoords[0] + offset[0], cellCoords[1] + offset[1]];
  const cell = board[coords[0]] ? board[coords[0]][coords[1]] : undefined;
  if (!cell) return undefined;
  return { cell, coords };
};

const getNeighboringCells = (board: MinesweeperBoard, cellCoords: Vector): OffsetCell[] => NEIGHBOR_VECTORS
  .map(vector => getOffsetCell(board, cellCoords, vector))
  .filter(cell => cell !== undefined) as OffsetCell[];

export const setCellNeighbors = (board: MinesweeperBoard, [x, y]: Vector) => {
  const neighboringCells = getNeighboringCells(board, [x, y]);
  const neighbors = neighboringCells.reduce((count, { cell }) => count + Number(Boolean(cell.isMine)), 0);
  board[x][y] = board[x][y].updateNeighbors(neighbors);
};

export const getEmptyBoard = (): MinesweeperBoard => Array(BOARD_WIDTH)
  .fill(undefined)
  .map(() => Array(BOARD_HEIGHT).fill(undefined).map(() => new MinesweeperCell()));

const cloneBoard = (board: MinesweeperBoard) => board.map(column => [...column]);

export const clearEmptyCells = (board: MinesweeperBoard, [x, y]: Vector, clone = true): MinesweeperBoard => {
  const newBoard = clone ? cloneBoard(board) : board;
  const cell = newBoard[x][y];
  if (cell.isUnflaggedEmpty) {
    newBoard[x][y] = cell.clear();
    if (cell.neighbors === 0) {
      getNeighboringCells(newBoard, [x, y]).forEach(({ cell, coords }) => {
        if (cell.isUnflaggedEmpty) clearEmptyCells(newBoard, coords, false);
      });
    }
  }
  return newBoard;
};

export const clearNeighbors = (board: MinesweeperBoard, [x, y]: Vector): MinesweeperBoard | null => {
  const cell = board[x][y];
  const neighbors = getNeighboringCells(board, [x, y]);
  const flaggedCount = neighbors.reduce((count, { cell }) => count + Number(Boolean(cell.isFlagged)), 0);
  if (cell.neighbors === flaggedCount) {
    if (neighbors.some(({ cell }) => cell.isUnflaggedMine)) return null;
    const newBoard = cloneBoard(board);
    neighbors.forEach(({ coords }) => clearEmptyCells(newBoard, coords, false));
    return newBoard;
  }
  return board;
};

export const revealMines = (board: MinesweeperBoard, exploded: boolean): MinesweeperBoard => {
  const newBoard = cloneBoard(board);
  newBoard.forEach((column, x) => column.forEach((cell, y) => {
    if (cell.isMine) newBoard[x][y] = new MinesweeperCell(exploded ? 'explodedMine' : 'mine');
  }));
  return newBoard;
};

export const allCleared = (board: MinesweeperBoard): boolean => board.every(
  column => column.every(cell => cell.isMine || cell.isCleared),
);

// ---------------------------------------------------------------- Game ----

const placeRandomMines = (count: number, startingCell: Vector): Vector[] => {
  const boardSize = BOARD_WIDTH * BOARD_HEIGHT;
  const mineIndices = new Set<number>();
  const startingCellIndex = vectorToIndex(startingCell);
  while (mineIndices.size < count) {
    const randomIndex = Math.floor(Math.random() * boardSize);
    if (randomIndex !== startingCellIndex) mineIndices.add(randomIndex);
  }
  return Array.from(mineIndices).map(indexToVector);
};

export class MinesweeperGame {
  public endTime: number | undefined = undefined;

  constructor(
    public board: MinesweeperBoard,
    public startTime: number | undefined,
    public gameStage: GameStage,
  ) {
    if (gameStage === 'win') this.endTime = Date.now();
  }

  // Elapsed seconds between start and end (0 until both exist). Kept here, in pure
  // code, so the undefined-handling enjoys normal type narrowing — Reactive TS's lifting
  // doesn't carry a ternary's narrowing into the lifted branches, so the same
  // arithmetic written as a reactive expression would see `number | undefined`.
  public get duration(): number {
    if (this.startTime === undefined || this.endTime === undefined) return 0;
    return Math.round((this.endTime - this.startTime) / 1000);
  }

  // Apply an action. A 'start' always (re)starts — even from 'win'/'gameOver' — so
  // the Restart button works at any time; other actions are ignored once the game
  // has ended.
  public dispatch(action: CellAction): MinesweeperGame {
    const { type, cell } = action;
    if (type === 'start') return this.startGame(cell);
    if (isOneOf<GameStage>(this.gameStage, ['win', 'gameOver'])) return this;
    if (type === 'discover') return this.clearCells(cell);
    return this.toggleFlagged(cell);
  }

  private startGame(startingCell: Vector) {
    const board = getEmptyBoard();
    const mines = placeRandomMines(MINE_COUNT, startingCell);
    mines.forEach(([x, y]) => board[x][y] = new MinesweeperCell('unflaggedMine'));
    board.forEach((column, x) => column.forEach((_, y) => setCellNeighbors(board, [x, y])));
    return new MinesweeperGame(board, Date.now(), 'playing').clearCells(startingCell);
  }

  private clearCells([x, y]: Vector) {
    const cell = this.board[x][y];
    if (cell.isMine) return this.gameOver();
    else if (cell.isUnflaggedEmpty) return this.clearEmpty([x, y]);
    else if (cell.isCleared && cell.hasNeighbors) return this.clearNeighbors([x, y]);
    else return this;
  }

  private toggleFlagged([x, y]: Vector) {
    const previousCell = this.board[x][y];
    if (!previousCell.isCleared) {
      return this.updateCell([x, y], previousCell.toggleFlagged());
    }
    return this;
  }

  private updateCell([x, y]: Vector, newCell: MinesweeperCell) {
    const newBoard = [...this.board];
    newBoard[x] = [...newBoard[x]];
    newBoard[x][y] = newCell;
    return this.updateBoard(newBoard);
  }

  private clearEmpty(coords: Vector) {
    const newBoard = clearEmptyCells(this.board, coords);
    if (allCleared(newBoard)) return this.win(newBoard);
    return this.updateBoard(newBoard);
  }

  private clearNeighbors(coords: Vector) {
    const newBoard = clearNeighbors(this.board, coords);
    if (newBoard === null) return this.gameOver();
    if (allCleared(newBoard)) return this.win(newBoard);
    return this.updateBoard(newBoard);
  }

  private updateBoard(newBoard: MinesweeperBoard) {
    return new MinesweeperGame(newBoard, this.startTime, 'playing');
  }

  private gameOver() {
    return new MinesweeperGame(revealMines(this.board, true), undefined, 'gameOver');
  }

  private win(newBoard: MinesweeperBoard) {
    return new MinesweeperGame(revealMines(newBoard, false), this.startTime, 'win');
  }
}

export const getInitialGame = (): MinesweeperGame => new MinesweeperGame(getEmptyBoard(), undefined, 'pregame');

// The fold step for the reactive loop: the first action (while still in 'pregame')
// becomes the game-starting click; everything after is dispatched as-is.
export const reduceGame = (game: MinesweeperGame, action: CellAction): MinesweeperGame =>
  game.dispatch(game.gameStage === 'pregame' ? { ...action, type: 'start' } : action);
