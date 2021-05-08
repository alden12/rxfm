import { Div, flatten, mapToComponents, styles, classes, event } from "rxfm";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BOARD_HEIGHT } from "../constants";
import { MinesweeperBoard } from "../game-logic/minesweeper-board";
import { CellAction } from "../types";
import { GameCell } from "./game-cell";

export const GameBoard = (board: Observable<MinesweeperBoard>, onCellAction: (action: CellAction) => void) => Div(
  board.pipe(
    map(flatten),
    mapToComponents(
      (_, i) => i,
      (cell, i) => GameCell(cell, i, onCellAction),
    ),
  ),
).pipe(
  event('contextmenu', ev => ev.preventDefault()),
  styles({ gridTemplateRows: `repeat(${BOARD_HEIGHT}, max-content)` }),
  classes('minesweeper-board'),
);