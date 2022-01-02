import RxFM from "rxfm";
import { Observable, of, timer } from "rxjs";
import { switchMap, filter, map, scan, startWith, distinctUntilChanged } from "rxjs/operators";
import { MinesweeperGameState } from "../game-logic/minesweeper-game";
import { CellAction } from "../types";

interface ControlsProps {
  gameState: Observable<MinesweeperGameState>;
  dispatch: (action: CellAction) => void;
}

export const Controls = ({ gameState, dispatch }: ControlsProps) => {
  const gameTime = gameState.pipe(
    switchMap(({ startTime, endTime }) => {
      if (!startTime) return of(0);
      else if (!endTime) return timer(0, 1000);
      return of(Math.round((endTime - startTime) / 1000));
    }),
  );

  const HighScore = gameState.pipe(
    filter(({ startTime, endTime }) => Boolean(startTime) && Boolean(endTime)),
    map(({ startTime, endTime }) => Math.round((endTime! - startTime!) / 1000)),
    scan((lowestTime, time) => Math.min(lowestTime, time), Infinity),
    startWith(undefined),
    distinctUntilChanged(),
    switchMap(highScore => highScore ? <div>Highscore: {highScore}s</div> : of(null)),
  );

  const WinLoseMessage = gameState.pipe(
    switchMap(({ gameStage }) => {
      if (gameStage === 'win') return <div>You Win!</div>;
      if (gameStage === 'gameOver') return <div>Game Over!</div>;
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
