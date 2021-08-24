import RxFM from "rxfm";
import { Observable, combineLatest, of, timer } from "rxjs";
import { switchMap, filter, map, scan, startWith, distinctUntilChanged } from "rxjs/operators";
import { GameStage, CellAction } from "../types";

interface ControlsProps {
  startTime: Observable<number | undefined>;
  endTime: Observable<number | undefined>;
  gameStage: Observable<GameStage>;
  dispatch: (action: CellAction) => void;
}

export const Controls = ({ startTime, endTime, gameStage, dispatch }: ControlsProps) => {
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
    switchMap(highScore => highScore ? <div>Highscore: {highScore}s</div> : of(null)),
  );

  const WinLoseMessage = gameStage.pipe(
    switchMap(stage => {
      if (stage === 'win') return <div>You Win!</div>;
      if (stage === 'gameOver') return <div>Game Over!</div>;
      return of(null);
    }),
  );

  return <div class="minesweeper-controls">
    <button onClick={() => dispatch({ type: 'start', cell: [0, 0] })}>Restart</button>
    <div>Time: {gameTime}s</div>
    {HighScore}
    {WinLoseMessage}
  </div>;
};
