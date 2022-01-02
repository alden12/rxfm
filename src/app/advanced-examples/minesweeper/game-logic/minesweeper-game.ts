import { Observable } from "rxjs";
import { tap, map, scan, startWith, retry, shareReplay } from "rxjs/operators";
import { BOARD_HEIGHT, BOARD_WIDTH, indexToVector, isOneOf, MINE_COUNT, vectorToIndex } from "../constants";
import { MinesweeperBoard, getEmptyBoard, setCellNeighbors, revealMines, clearEmptyCells, allCleared, clearNeighbors } from "./minesweeper-board";
import { MinesweeperCell } from "./minesweeper-cell";
import { Vector, CellActionType, GameStage, CellAction } from "../types";

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

class MinesweeperGame {
  public endTime: number | undefined = undefined;

  private actionMap: Record<CellActionType, (cell: Vector) => MinesweeperGame> = {
    discover: (cell: Vector) => this.clearCells(cell),
    flag: (cell: Vector) => this.toggleFlagged(cell),
    start: (cell: Vector) => this.startGame(cell),
  };

  constructor(
    public board: MinesweeperBoard,
    public startTime: number | undefined,
    public gameStage: GameStage,
  ) {
    if (gameStage === 'win') this.endTime = Date.now();
  }

  public dispatch(action: CellAction) {
    if (isOneOf<GameStage>(this.gameStage, ['win', 'gameOver'])) return this;
    const { type, cell } = action;
    return this.actionMap[type](cell);
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

export interface MinesweeperGameState {
  board: MinesweeperBoard;
  startTime: number | undefined;
  endTime: number | undefined;
  gameStage: GameStage;
}

const getStartingState = (): MinesweeperGameState => ({
  board: getEmptyBoard(),
  startTime: undefined,
  endTime: undefined,
  gameStage: 'pregame',
});

export const minesweeperGameLoop = (action: Observable<CellAction>): Observable<MinesweeperGameState> => action.pipe(
  tap(({ type }) => {
    if (type === 'start') throw new Error('Restart Game');
  }),
  map((action, i) => i === 0 ? { type: 'start' as const, cell: action.cell } : action),
  scan((board, action) => board.dispatch(action), new MinesweeperGame(getEmptyBoard(), undefined, 'pregame')),
  startWith(getStartingState()),
  retry(),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
