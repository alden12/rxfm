import { destructure, Div, event, flatten, mapToComponents, styles, using } from 'rxfm';
import { Observable, Subject } from 'rxjs';
import { map, scan, startWith } from 'rxjs/operators';

// Types:

type MinesweeperCellType = 'cleared' | 'undiscovered' | 'marked' | 'mine' | 'exploded';
type MinesweeperCell = { type: MinesweeperCellType, neighbors: number | null };
type MinesweeperBoard = MinesweeperCell[][];
type Vector = [number, number]; // [x, y]

type CellActionType = 'discover' | 'mark';

interface CellAction {
  type: CellActionType;
  cell: Vector;
}

// Constants:

const BOARD_WIDTH = 14;
const BOARD_HEIGHT = 7;

const CELL_COLOR_MAP: Record<MinesweeperCellType, string> = {
  cleared: 'grey',
  undiscovered: 'lightgrey',
  marked: 'teal',
  mine: 'black',
  exploded: 'red'
};

// Game Logic:

const getEmptyBoard = (): MinesweeperBoard => Array(BOARD_WIDTH)
  .fill(undefined)
  .map(() => Array(BOARD_HEIGHT).fill({ type: 'undiscovered', neighbors: null }));

const updateBoard = (board: MinesweeperBoard, action?: CellAction) => {
  if (!action) return board;
  const { type, cell: [x, y] } = action;
  const newBoard = [...board];
  const newCell: MinesweeperCellType = type === 'discover' ? 'cleared' : 'marked';
  newBoard[x] = [...newBoard[x]];
  newBoard[x][y] = { type: newCell, neighbors: newBoard[x][y].neighbors };
  return newBoard;
};

const minesweeperGameLoop = (action: Observable<CellAction>) => action.pipe(
  startWith(undefined),
  scan(updateBoard, getEmptyBoard()),
)

// Display Logic

const GameCell = (
  cell: Observable<MinesweeperCell>,
  index: Observable<number>,
  onCellAction: (action: CellAction) => void,
) => {
  const { type, neighbors } = destructure(cell);

  const handleCellAction = (type: CellActionType) => using(index, index => () => onCellAction({
    type,
    cell: [Math.floor(index / BOARD_HEIGHT), index % BOARD_HEIGHT],
  }))

  return Div(neighbors).pipe(
    styles({
      height: '20px',
      width: '20px',
      backgroundColor: using(type, type => CELL_COLOR_MAP[type]),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: '1px solid white',
    }),
    event('click', handleCellAction('discover')),
    event('contextmenu', handleCellAction('mark')),
  );
};

export const GameBoard = (board: Observable<MinesweeperBoard>, onCellAction: (action: CellAction) => void) => Div(
  board.pipe(
    map(flatten),
    mapToComponents(
      (_, i) => i,
      (cell, i) => GameCell(cell, i, onCellAction),
    ),
  ),
).pipe(
  styles({
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: 'max-content',
    gridTemplateRows: `repeat(${BOARD_HEIGHT}, max-content)`,
  }),
  event('contextmenu', ev => ev.preventDefault()),
);

export const Minesweeper = () => {
  const cellAction = new Subject<{ type: 'discover' | 'mark', cell: Vector }>();

  return Div(
    GameBoard(
      minesweeperGameLoop(cellAction),
      action => cellAction.next(action),
    ),
  );
};
