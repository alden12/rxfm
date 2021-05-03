import { NEIGHBOR_VECTORS, BOARD_WIDTH, BOARD_HEIGHT } from "../constants";
import { MinesweeperCell } from "./minesweeper-cell";
import { Vector } from "../types";

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
}

const getNeighboringCells = (board: MinesweeperBoard, [x, y]: Vector): OffsetCell[] => NEIGHBOR_VECTORS
  .map(vector => getOffsetCell(board, [x, y], vector))
  .filter(cell => cell !== undefined) as OffsetCell[];

export const setCellNeighbors = (board: MinesweeperBoard, [x, y]: Vector) => {
  const neighboringCells = getNeighboringCells(board, [x, y]);
  const neighbors = neighboringCells.reduce((count, { cell }) => count + Number(Boolean(cell.isMine)), 0);
  board[x][y] = board[x][y].updateNeighbors(neighbors);
}

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
}

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
