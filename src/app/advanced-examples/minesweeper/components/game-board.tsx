import RxFM, { flatten, mapToComponents, FC } from "rxfm";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BOARD_HEIGHT } from "../constants";
import { MinesweeperBoard } from "../game-logic/minesweeper-board";
import { CellAction } from "../types";
import { GameCell } from "./game-cell";

interface GameBoardProps {
  board: Observable<MinesweeperBoard>;
  dispatch: (action: CellAction) => void;
}

export const GameBoard: FC<GameBoardProps> = ({ board, dispatch }) => (
  <div class="minesweeper-board" style={{ gridTemplateRows: `repeat(${BOARD_HEIGHT}, max-content)` }} onContextMenu={ev => ev.preventDefault()}>
    {board.pipe(
      map(flatten),
      mapToComponents((cell, index) => <GameCell cell={cell} index={index} dispatch={dispatch} />),
    )}
  </div>
);
