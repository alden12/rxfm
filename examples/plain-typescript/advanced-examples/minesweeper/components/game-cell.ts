import { destructure, Div, conditional, and, styles, classes, events, access } from "rxfm";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { indexToVector, NEIGHBORS_COLOR_MAP } from "../constants";
import { MinesweeperCell } from "../game-logic/minesweeper-cell";
import { CellAction, CellActionType } from "../types";

interface GameCellProps {
  cell: Observable<MinesweeperCell>;
  index: Observable<number>;
  dispatch: (action: CellAction) => void;
}

export const GameCell = ({ cell, index, dispatch }: GameCellProps) => {
  const { neighbors, hasNeighbors, symbol, color, isCleared, isUndiscovered } = destructure(cell);

  const handleCellAction = (type: CellActionType) => index.pipe(
    map(i => () => dispatch({ type, cell: indexToVector(i) }))
  );

  const cellText = conditional({
    if: and(isCleared, hasNeighbors),
    then: neighbors,
    else: symbol,
  });

  return Div(cellText).pipe(
    events({
      click: handleCellAction('discover'),
      contextmenu: handleCellAction('flag'),
    }),
    styles({
      backgroundColor: color,
      color: access(NEIGHBORS_COLOR_MAP, neighbors),
      fontSize: conditional(symbol, '12px', '14px'),
    }),
    classes`minesweeper-cell ${conditional(isUndiscovered, 'raised')}`,
  );
};
