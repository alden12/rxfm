// The reactive "engine" for Minesweeper, in its own .tsrx file. A single action
// Subject is folded into the game state with `accumulate` (the explicit form of
// `scan`); every other value here is a plain derivation that tsrx lifts. The view
// (minesweeper.tsrx) imports these and renders them.
//
// How the original RxJS operators map to imperative analogues:
//   scan(...)                    → accumulate(...)        — the running game fold
//   throw 'Restart' + retry()    → reduceGame resets      — explicit restart (see game-logic)
//   switchMap(start/end → timer) → ternary + interval     — a clock that starts/stops/freezes
//   filter(both times) + scan    → `? : EMPTY` + accumulate — best-time, only on wins
import { Subject, startWith } from 'rxjs';
import { accumulate, interval, EMPTY } from '../runtime';
import { getInitialGame, reduceGame } from './game-logic';
import { CellAction } from './types';

// The one input: cell clicks / flags / restart. The view dispatches into it.
export const cellAction = new Subject<CellAction>();
export const dispatch = (action: CellAction) => cellAction.next(action);

// Fold each action into the next game state. `accumulate` (scan) doesn't emit
// until the first action, and the action Subject is silent on load, so the
// initial board would be blank until the first click — `startWith` seeds the
// starting state immediately (mirrors the plain version's `startWith(getStartingState())`).
const game = accumulate(cellAction, reduceGame, getInitialGame()) ?? getInitialGame();

// Derived reactive views of the state. Destructuring a stream lifts each field
// into its own derivation, so this reads like plain object destructuring.
export const { board, gameStage } = game;
const duration = game.duration;

// Seconds since the game began: 0 before play; a 1-second clock while playing
// (interval is (re)subscribed when this branch is selected, i.e. when the game
// reaches 'playing', so it counts from the start); the frozen final time once ended.
export const gameTime =
  gameStage === 'pregame' ? 0
  : gameStage === 'playing' ? interval(1000)
  : duration;

// Best (lowest) winning time. Only a win contributes; `: EMPTY` filters everything
// else out, and `accumulate` keeps the running minimum.
const winTime = gameStage === 'win' ? duration : EMPTY;
export const highScore = accumulate(winTime, (best, time) => Math.min(best, time), Infinity);
