import { destructure, Div, event, flatten, mapToComponents, styles, using } from 'rxfm';
import { Observable, Subject } from 'rxjs';
import { map, retry, scan, startWith } from 'rxjs/operators';

// Types:

type MinesweeperCellType = 'cleared' | 'undiscoveredEmpty' | 'undiscoveredMine' | 'markedMine' | 'markedEmpty' | 'exploded';
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

const MINE_COUNT = 10;

const CELL_COLOR_MAP: Record<MinesweeperCellType, string> = {
  cleared: 'grey',
  undiscoveredEmpty: 'lightgrey',
  undiscoveredMine: 'black', // TODO: Set to same color as undiscoveredEmpty.
  markedMine: 'teal',
  markedEmpty: 'teal',
  exploded: 'red',
};

// Game Logic:

const indexToVector = (index: number): Vector => [Math.floor(index / BOARD_HEIGHT), index % BOARD_HEIGHT];

// TODO: Take initial click coord and exclude this from possible mines.
const placeRandomMines = (count: number): Vector[] => {
  const boardSize = BOARD_WIDTH * BOARD_HEIGHT;
  const mineIndices = new Set<number>();
  while (mineIndices.size < count) {
    mineIndices.add(Math.floor(Math.random() * boardSize));
  }
  return Array.from(mineIndices).map(indexToVector);
};

const getEmptyBoard = (mines?: Vector[]): MinesweeperBoard => {
  const board = Array(BOARD_WIDTH)
    .fill(undefined)
    .map(() => Array(BOARD_HEIGHT).fill({ type: 'undiscoveredEmpty', neighbors: null }));
  mines?.forEach(([x, y]) => board[x][y] = { type: 'undiscoveredMine', neighbors: null });
  return board;
}

const isMine = ({ type }: MinesweeperCell) => type === 'undiscoveredMine' || type === 'markedMine';
const isMarked = ({ type }: MinesweeperCell) => type === 'markedEmpty' || type === 'markedMine';

const clearCells = (board: MinesweeperBoard, [x, y]: Vector) => {
  const previousCell = board[x][y];
  if (previousCell.type === 'undiscoveredEmpty') {
    const newBoard = [...board];
    newBoard[x] = [...newBoard[x]];
    newBoard[x][y] = { type: 'cleared', neighbors: board[x][y].neighbors };
    // TODO: clear surrounding area.
    return newBoard;
  } else if (isMine(previousCell)) {
    throw new Error('Game Over!');
  }
  return board;
}

const markCell = (board: MinesweeperBoard, [x, y]: Vector) => {
  const previousCell = board[x][y];
  if (isMarked(previousCell)) return board;
  const newBoard = [...board];
  const newCellType: MinesweeperCellType = isMine(previousCell) ? 'markedMine' : 'markedEmpty';
  newBoard[x] = [...newBoard[x]];
  newBoard[x][y] = { type: newCellType, neighbors: board[x][y].neighbors };
  return newBoard;
};

const getNewBoard = (board: MinesweeperBoard, action: CellAction) => {
  const { type, cell } = action;
  if (type === 'discover') {
    return clearCells(board, cell);
  } else if (type === 'mark') {
    return markCell(board, cell);
  }
  return board;
};

const minesweeperGameLoop = (action: Observable<CellAction>) => action.pipe(
  scan(getNewBoard, getEmptyBoard(placeRandomMines(MINE_COUNT))),
  startWith(getEmptyBoard()),
  retry(),
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
    cell: indexToVector(index),
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
