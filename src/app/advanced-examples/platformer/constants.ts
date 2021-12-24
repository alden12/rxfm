import { timeDelta } from "rxfm";
import { scheduled, of, animationFrameScheduler } from "rxjs";
import { repeat, share } from "rxjs/operators";
import { Direction, Vector } from "./types";

export const PIXELS_PER_METER = 20;
export const ZERO: Vector = [0, 0];

export const MAX_FRAME_TIME_MS = 100;

export const GRAVITY = 9.81;

export const WIDTH = PIXELS_PER_METER * 20;
export const HEIGHT = PIXELS_PER_METER * 8;

export const PLAYER_INITIAL_X = WIDTH / 2;
export const PLAYER_INITIAL_Y = HEIGHT / 2 - 20;

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

export const frameTimer = scheduled(of(null), animationFrameScheduler).pipe(
  repeat(),
  timeDelta(delta => Math.min(delta, MAX_FRAME_TIME_MS)),
  share(),
);
