import { classes, destructure, Div } from 'rxfm';
import { Subject } from 'rxjs';
import { minesweeperGameLoop } from './game-logic/minesweeper-game';
import { CellAction } from './types';
import { GameBoard } from './components/game-board';
import { Controls } from './components/controls';

import './minesweeper-styles.css';

export const Minesweeper = () => {
  const cellAction = new Subject<CellAction>();
  const dispatch = (action: CellAction) => cellAction.next(action);

  const { board, startTime, endTime, gameStage } = destructure(
    minesweeperGameLoop(cellAction),
  );

  return Div(
    GameBoard(board, dispatch),
    Controls(startTime, endTime, gameStage, dispatch),
  ).pipe(
    classes('minesweeper'),
  );
};
