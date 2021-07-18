import { Div, flatten, mapToComponents, classes, event, style } from "rxfm";
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

export const GameBoard = ({ board, dispatch }: GameBoardProps) => Div(
  // board.pipe(
  //   map(flatten),
  //   mapToComponents(
  //     (_, index) => index,
  //     (cell, index) => GameCell({ cell, index, dispatch }),
  //   ),
  // ),
).pipe(
  event.contextmenu(ev => ev.preventDefault()),
  style.gridTemplateRows`repeat(${BOARD_HEIGHT}, max-content)`,
  classes`minesweeper-board`,
);
