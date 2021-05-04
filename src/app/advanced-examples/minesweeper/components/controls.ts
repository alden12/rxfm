import { Div, Button, classes, event } from "rxfm";
import { Observable, combineLatest, of, timer } from "rxjs";
import { switchMap, filter, map, scan, startWith, distinctUntilChanged } from "rxjs/operators";
import { GameStage, CellAction } from "../types";

export const Controls = (
  startTime: Observable<number | undefined>,
  endTime: Observable<number | undefined>,
  gameStage: Observable<GameStage>,
  dispatch: (action: CellAction) => void,
) => {
  const gameTime = combineLatest([startTime, endTime]).pipe(
    switchMap(([start, end]) => {
      if (!start) return of(0);
      else if (!end) return timer(0, 1000);
      return of(Math.round((end - start) / 1000));
    }),
  );

  const HighScore = combineLatest([startTime, endTime]).pipe(
    filter(([start, end]) => Boolean(start) && Boolean(end)),
    map(([start, end]) => Math.round((end! - start!) / 1000)),
    scan((lowestTime, time) => Math.min(lowestTime, time), Infinity),
    startWith(undefined),
    distinctUntilChanged(),
    switchMap(highScore => highScore ? Div`Highscore: ${highScore}s` : of(null)),
  );

  const WinLoseMessage = gameStage.pipe(
    switchMap(stage => {
      if (stage === 'win') return Div`You Win!`;
      if (stage === 'gameOver') return Div`Game Over!`;
      return of(null);
    }),
  );

  return Div(
    Button`Restart`.pipe(
      event('click', () => dispatch({ type: 'start', cell: [0, 0] }))
    ),
    Div`Time: ${gameTime}s`,
    HighScore,
    WinLoseMessage,
  ).pipe(
    classes('minesweeper-controls'),
  );
};
