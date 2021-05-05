export type SnakeCell = 'empty' | 'trail' | 'food';
export type SnakeBoard = SnakeCell[][];
export type Vector = [number, number]; // [x, y]
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
