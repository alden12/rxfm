import { Div, flatten, mapToComponents, classes, event, style } from "rxfm";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BOARD_HEIGHT } from "../constants";
import { MinesweeperBoard } from "../game-logic/minesweeper-board";
import { CellAction } from "../types";
import { GameCell } from "./game-cell";

export const GameBoard = (board: Observable<MinesweeperBoard>, dispatch: (action: CellAction) => void) => Div(
  board.pipe(
    map(flatten),
    mapToComponents(
      (_, i) => i,
      (cell, i) => GameCell(cell, i, dispatch),
    ),
  ),
).pipe(
  event.contextmenu(ev => ev.preventDefault()),
  style.gridTemplateRows`repeat(${BOARD_HEIGHT}, max-content)`,
  classes`minesweeper-board`,
);
