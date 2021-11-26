import RxFM, { destructure, conditional, FC, and } from "rxfm";
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

export const GameCell: FC<GameCellProps> = ({ cell, index, dispatch }) => {
  const { neighbors, hasNeighbors, symbol, color, isCleared, isUndiscovered } = destructure(cell);

  const handleCellAction = (type: CellActionType) => index.pipe(
    map(index => () => dispatch({ type, cell: indexToVector(index) }))
  );

  const cellText = conditional({
    if: and(isCleared, hasNeighbors),
    then: neighbors,
    else: symbol,
  });

  const styles = {
    backgroundColor: color,
    color: neighbors.pipe(
      map(neighbors => NEIGHBORS_COLOR_MAP[neighbors]),
    ),
    fontSize: conditional(symbol, '12px', '14px'),
  };

  return <div
    style={styles}
    class={['minesweeper-cell', conditional(isUndiscovered, 'raised')]}
    onClick={handleCellAction('discover')}
    onContextMenu={handleCellAction('flag')}
  >
    {cellText}
  </div>;
};
