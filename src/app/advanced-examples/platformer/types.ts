export type Vector = [x: number, y: number];

export type Direction = 'up' | 'down' | 'left' | 'right';

export type PressedKey = [key: Direction, pressed: boolean];
export type PressedKeys = { [K in Direction]?: boolean };

export interface Spatial {
  position: Vector;
  velocity: Vector;
  acceleration: Vector;
}

export type WithPrevious<T> = {
  [K in keyof T]: T[K] | ((previousValue: T[K]) => T[K]);
};

export type BoundingBox = [left: number, top: number, right: number, bottom: number];
