import { destructure, Div, conditional, andGate, styles, using, classes, event } from "rxfm";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { indexToVector, NEIGHBORS_COLOR_MAP } from "../constants";
import { MinesweeperCell } from "../game-logic/minesweeper-cell";
import { CellAction, CellActionType } from "../types";

export const GameCell = (
  cell: Observable<MinesweeperCell>,
  index: Observable<number>,
  onCellAction: (action: CellAction) => void,
) => {
  const { neighbors, isDiscovered, symbol, hasNeighbors, color } = destructure(cell);

  const handleCellAction = (type: CellActionType) => index.pipe(
    map(i => () => onCellAction({ type, cell: indexToVector(i) }))
  );

  return Div(
    conditional(
      andGate(isDiscovered, hasNeighbors),
      neighbors,
      symbol,
    ),
  ).pipe(
    event('click', handleCellAction('discover')),
    event('contextmenu', handleCellAction('mark')),
    styles({
      backgroundColor: color,
      color: using(neighbors, neighbors => NEIGHBORS_COLOR_MAP[neighbors]),
      fontSize: using(symbol, symbol => symbol ? '12px' : '14px'),
    }),
    classes('minesweeper-cell'),
  );
};
