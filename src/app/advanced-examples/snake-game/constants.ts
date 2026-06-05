import { Vector, SnakeCell, Direction, Difficulty } from "./types";

export const BOARD_WIDTH = 20;
export const BOARD_HEIGHT = 10;

export const STARTING_SNAKE_COORDS: [Vector, ...Vector[]] = [[8, 4], [9, 4]];

export const CELL_COLOR_MAP: Record<SnakeCell, string> = {
  empty: 'lightgrey',
  trail: 'black',
  food: 'red',
};

export const DIRECTION_MAP: Record<Direction, Vector> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export const KEY_MAP: Record<string, Direction> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export const DIFFICULTY_TICK_PERIOD_MAP: Record<Difficulty, number> = {
  Easy: 250, // ms
  Medium: 200, // ms
  Hard: 150, // ms
};

export const DIFFICULTY_SCORE_MAP: Record<Difficulty, number> = {
  Easy: 10,
  Medium: 15,
  Hard: 20,
};
