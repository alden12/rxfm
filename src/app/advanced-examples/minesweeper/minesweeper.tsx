import RxFM, { destructure, FC } from 'rxfm';
import { Subject } from 'rxjs';
import { minesweeperGameLoop } from './game-logic/minesweeper-game';
import { CellAction } from './types';
import { GameBoard } from './components/game-board';
import { Controls } from './components/controls';

import './minesweeper-styles.css';

export const Minesweeper: FC = () => {
  const cellAction = new Subject<CellAction>();
  const dispatch = (action: CellAction) => cellAction.next(action);

  const { board, startTime, endTime, gameStage } = destructure(minesweeperGameLoop(cellAction));

  return <div class="minesweeper">
    <GameBoard board={board} dispatch={dispatch} />
    <Controls startTime={startTime} endTime={endTime} gameStage={gameStage} dispatch={dispatch} />
  </div>;
};
