import { MinesweeperCellType, Vector } from "./types";

export const BOARD_WIDTH = 15;
export const BOARD_HEIGHT = 8;

export const MINE_COUNT = 12;

export const CELL_COLOR_MAP: Record<MinesweeperCellType, string> = {
  cleared: 'darkgrey',
  undiscoveredEmpty: 'grey',
  undiscoveredMine: 'grey',
  markedMine: 'grey',
  markedEmpty: 'grey',
  explodedMine: 'red',
  mine: 'darkgrey',
};

export const CELL_SYMBOL_MAP: Partial<Record<MinesweeperCellType, string>> = {
  mine: '💣',
  markedEmpty: '🚩',
  markedMine: '🚩',
  explodedMine: '💥',
};

export const CELL_MARKING_MAP: Partial<Record<MinesweeperCellType, MinesweeperCellType>> = {
  undiscoveredEmpty: 'markedEmpty',
  markedEmpty: 'undiscoveredEmpty',
  undiscoveredMine: 'markedMine',
  markedMine: 'undiscoveredMine',
};

export const NEIGHBORS_COLOR_MAP: Record<number, string> = {
  1: 'blue',
  2: 'green',
  3: 'red',
  4: 'purple',
  5: 'black',
  6: 'grey',
  7: 'maroon',
  8: 'turquoise',
};

export const NEIGHBOR_VECTORS: Vector[] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
  [-1, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
];

export const isOneOf = <T>(testValue: T, values: T[]) => values.some(value => testValue === value);

export const indexToVector = (index: number): Vector => [Math.floor(index / BOARD_HEIGHT), index % BOARD_HEIGHT];
export const vectorToIndex = (vector: Vector): number => vector[0] * BOARD_HEIGHT + vector[1];
