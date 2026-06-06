// The reactive "engine", in its own .tsrx file: a clock, the per-tick state fold,
// and the derived board / scores — all written as plain expressions that tsrx lifts.
// There's no rxfm here, only reactive logic; the view (snake-game.tsrx) imports these
// values and renders them. Living in a separate file is exactly what cross-.tsrx
// support buys us (see ROADMAP B1) — the import below resolves with real types, so a
// derivation like `board.flat()` in the view still lifts.
//
// How each RxJS operator from the original maps to an imperative analogue:
//   scan(...)             → accumulate(...)            — running fold, made explicit
//   withLatestFrom(...)   → direction.value            — "what's the current heading?"
//   retry()/throw         → ?? getInitialSnakeState()  — reset on game over
//   switchMap(d => timer) → interval(period)           — a clock whose rate can change
import { BehaviorSubject } from 'rxjs';
import { accumulate, interval } from '../../runtime';
import { getInitialSnakeState, getNewSnakeState, getBoard } from './game-logic';
import { DIFFICULTY_TICK_PERIOD_MAP } from './constants';
import { Difficulty, Direction } from './types';

// Inputs the view drives.
export const difficulty = new BehaviorSubject<Difficulty>('Easy');
export const direction = new BehaviorSubject<Direction>('right');

// A clock whose rate follows the chosen difficulty (interval re-times on change).
const tick = interval(DIFFICULTY_TICK_PERIOD_MAP[difficulty]);

// Each tick advances the snake; a collision (null) resets to the initial state.
const state = accumulate(
  tick,
  snake => getNewSnakeState(snake, direction.value, difficulty.value) ?? getInitialSnakeState(),
  getInitialSnakeState(),
);

// Derived reactive values, exported for the view.
export const board = getBoard(state.trail.coordinates, state.food);
export const score = state.score;
export const highScore = accumulate(score, (highest, s) => Math.max(highest, s), 0);
