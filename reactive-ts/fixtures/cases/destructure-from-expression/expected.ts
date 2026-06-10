import { render } from "./runtime";
import { switchMap, map } from "rxjs/operators";
import { Observable, of } from 'rxjs';

interface Game {
  board: string[];
  stage: string;
  duration: number;
}

declare function accumulate<T, A>(source: Observable<T>, reducer: (acc: A, value: T) => A, seed: A): Observable<A | null>;
declare const actions: Observable<number>;
declare const reduceGame: (acc: Game, value: number) => Game;
declare function getInitialGame(): Game;

// Destructure an observable that is a larger expression, not a bare identifier
// (`accumulate(…) ?? getInitialGame()`). It can't be repeated per field — that would
// subscribe it once per field, each re-running its own scan — so it's hoisted into one
// synthetic binding (`item = render(…)`) and the fields fan off that, shared via render.
const item = render(accumulate(actions, reduceGame, getInitialGame()).pipe(switchMap(_l => _l != null ? of(_l) : of(getInitialGame())))), board = render(item.pipe(map(item => item.board))), stage = render(item.pipe(map(item => item.stage))), duration = render(item.pipe(map(item => item.duration)));

// A field is now an observable binding, so a read of it lifts as usual.
const cellCount = render(board.pipe(map(board => board.length)));
