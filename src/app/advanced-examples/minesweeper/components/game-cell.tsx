import RxFM, { FC } from "rxfm";
import { Observable } from "rxjs";
import { map, pluck } from "rxjs/operators";
import { indexToVector, NEIGHBORS_COLOR_MAP } from "../constants";
import { MinesweeperCell } from "../game-logic/minesweeper-cell";
import { CellAction, CellActionType } from "../types";

interface GameCellProps {
  cell: Observable<MinesweeperCell>;
  index: Observable<number>;
  dispatch: (action: CellAction) => void;
}

export const GameCell: FC<GameCellProps> = ({ cell, index, dispatch }) => {

  const handleCellAction = (type: CellActionType) => index.pipe(
    map(index => () => dispatch({ type, cell: indexToVector(index) }))
  );

  const cellText = cell.pipe(
    map(({ isCleared, hasNeighbors, neighbors, symbol }) => isCleared && hasNeighbors ? neighbors : symbol),
  );

  const styles = {
    backgroundColor: cell.pipe(pluck('color')),
    color: cell.pipe(
      map(({ neighbors }) => NEIGHBORS_COLOR_MAP[neighbors]),
    ),
    fontSize: cell.pipe(
      map(({ symbol }) => symbol ? '12px' : '14px'),
    ),
  };

  return <div
    style={styles}
    class={['minesweeper-cell', cell.pipe(
      map(({ isUndiscovered }) => isUndiscovered && 'raised'),
    )]}
    onClick={handleCellAction('discover')}
    onContextMenu={handleCellAction('flag')}
  >
    {cellText}
  </div>;
};
