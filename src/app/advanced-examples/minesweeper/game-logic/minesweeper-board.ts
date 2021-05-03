import { NEIGHBOR_VECTORS, BOARD_WIDTH, BOARD_HEIGHT } from "../constants";
import { MinesweeperCell } from "./minesweeper-cell";
import { Vector } from "../types";

export type MinesweeperBoard = MinesweeperCell[][];

const getOffsetCell = (board: MinesweeperBoard, cell: Vector, offset: Vector): MinesweeperCell | undefined => {
  return board[cell[0] + offset[0]] ? board[cell[0] + offset[0]][cell[1] + offset[1]] : undefined;
}

export const setCellNeighbors = (board: MinesweeperBoard, [x, y]: Vector) => {
  const neighboringCells = NEIGHBOR_VECTORS.map(vector => getOffsetCell(board, [x, y], vector));
  const neighbors = neighboringCells.reduce((count, cell) => cell ? count + Number(Boolean(cell.isMine)) : count, 0);
  board[x][y] = board[x][y].updateNeighbors(neighbors);
}

export const getEmptyBoard = (): MinesweeperBoard => Array(BOARD_WIDTH)
  .fill(undefined)
  .map(() => Array(BOARD_HEIGHT).fill(undefined).map(() => new MinesweeperCell()));

export const cloneBoard = (board: MinesweeperBoard) => board.map(column => [...column]);

export const clearEmptyCells = (board: MinesweeperBoard, [x, y]: Vector) => {
  const cell = board[x][y];
  if (cell.isUndiscoveredEmpty) {
    board[x][y] = cell.clear();
    if (cell.neighbors === 0) {
      NEIGHBOR_VECTORS.forEach(vector => {
        const offsetCell = getOffsetCell(board, [x, y], vector);
        if (offsetCell && offsetCell.isUndiscoveredEmpty) clearEmptyCells(board, [x + vector[0], y + vector[1]]);
      });
    }
  }
}

export const revealMines = (board: MinesweeperBoard, exploded: boolean): MinesweeperBoard => {
  const newBoard = cloneBoard(board);
  newBoard.forEach((column, x) => column.forEach((cell, y) => {
    if (cell.isMine) newBoard[x][y] = new MinesweeperCell(exploded ? 'explodedMine' : 'mine');
  }));
  return newBoard;
};

export const allCleared = (board: MinesweeperBoard): boolean => board.every(
  column => column.every(cell => cell.isMine || cell.isDiscovered),
);
