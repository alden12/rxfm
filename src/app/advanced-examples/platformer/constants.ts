import { Direction, Vector } from "./types";

export const PIXELS_PER_METER = 20;
export const ZERO: Vector = [0, 0];
export const FRAME_TIME_MS = 20;

export const GRAVITY = 9.81;

export const WIDTH = PIXELS_PER_METER * 20;
export const HEIGHT = PIXELS_PER_METER * 7;

export const PLAYER_SPEED = 4; // m/s

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
