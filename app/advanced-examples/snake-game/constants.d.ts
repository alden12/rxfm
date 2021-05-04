import { Vector, SnakeCell, Direction, Difficulty } from "./types";
export declare const BOARD_WIDTH = 20;
export declare const BOARD_HEIGHT = 10;
export declare const STARTING_SNAKE_COORDS: [Vector, ...Vector[]];
export declare const CELL_COLOR_MAP: Record<SnakeCell, string>;
export declare const DIRECTION_MAP: Record<Direction, Vector>;
export declare const KEY_MAP: Record<string, Direction>;
export declare const DIFFICULTY_TICK_PERIOD_MAP: Record<Difficulty, number>;
export declare const DIFFICULTY_SCORE_MAP: Record<Difficulty, number>;
