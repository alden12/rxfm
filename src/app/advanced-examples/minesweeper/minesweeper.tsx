import RxFM, { FC } from 'rxfm';
import { Subject } from 'rxjs';
import { minesweeperGameLoop } from './game-logic/minesweeper-game';
import { CellAction } from './types';
import { GameBoard } from './components/game-board';
import { Controls } from './components/controls';
import { pluck } from 'rxjs/operators';

import './minesweeper-styles.css';

export const Minesweeper: FC = () => {
  const cellAction = new Subject<CellAction>();
  const dispatch = (action: CellAction) => cellAction.next(action);

  const gameState = minesweeperGameLoop(cellAction);

  return <div class="minesweeper">
    <GameBoard board={gameState.pipe(pluck('board'))} dispatch={dispatch} />
    <Controls gameState={gameState} dispatch={dispatch} />
  </div>;
};
