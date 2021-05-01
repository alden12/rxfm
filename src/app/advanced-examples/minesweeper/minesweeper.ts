import { andGate, conditional, destructure, Div, event, flatten, mapToComponents, styles, using } from 'rxfm';
import { Observable, Subject } from 'rxjs';
import { map, retry, scan, startWith } from 'rxjs/operators';

// Types:

type MinesweeperBoard = MinesweeperCell[][];
type Vector = [number, number]; // [x, y]

type CellActionType = 'discover' | 'mark';

interface CellAction {
  type: CellActionType;
  cell: Vector;
}

interface MinesweeperCellProperties {
  isMine?: boolean;
  isMarked?: boolean;
  isDiscovered?: boolean;
  isExploded?: boolean;
  neighbors?: number;
}

// Constants:

const BOARD_WIDTH = 14;
const BOARD_HEIGHT = 7;

const MINE_COUNT = 10;

// Game Logic:

class MinesweeperCell {
  public isMine = false;
  public isDiscovered = false;
  public isMarked = false;
  public isExploded = false;
  public neighbors = 0;

  constructor({ isMine, isDiscovered, isMarked, isExploded, neighbors }: MinesweeperCellProperties = {}) {
    this.isMine = isMine ?? this.isMine;
    this.isDiscovered = isDiscovered ?? this.isDiscovered;
    this.isMarked = isMarked ?? this.isMine;
    this.isExploded = isExploded ?? this.isExploded;
    this.neighbors = neighbors ?? this.neighbors;
  }

  public get isUndiscoveredEmpty(): boolean {
    return !this.isDiscovered && !this.isMine;
  }

  public get hasNeighbors(): boolean {
    return this.neighbors > 0;
  }

  public update(newProperties: MinesweeperCellProperties): MinesweeperCell {
    return new MinesweeperCell({ ...this, ...newProperties });
  }

  public get color(): string {
    if (this.isExploded) {
      return 'red';
    } else if (this.isDiscovered) {
      return 'grey';
    } else if (this.isMine) {
      return 'black'; // TODO: remove this.
    } else if (this.isMarked) {
      return 'teal';
    }
    return 'lightgrey'; // Undiscovered empty.
  }
}

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

const calculateCellNeighbors = (board: MinesweeperBoard, cell: Vector): MinesweeperBoard => {
  return board;
}

const getBoard = (mines?: Vector[]): MinesweeperBoard => {
  const board = Array(BOARD_WIDTH)
    .fill(undefined)
    .map(() => Array(BOARD_HEIGHT).fill(new MinesweeperCell()));
  mines?.forEach(([x, y]) => board[x][y] = new MinesweeperCell({ isMine: true }));
  // TODO: Set cell neighbors if mines provided, only show when discovered.
  return board;
}

const updateBoardCell = (board: MinesweeperBoard, [x, y]: Vector, newCell: MinesweeperCell): MinesweeperBoard => {
  const newBoard = [...board];
  newBoard[x] = [...newBoard[x]];
  newBoard[x][y] = newCell;
  return newBoard;
};

const clearCells = (board: MinesweeperBoard, [x, y]: Vector): MinesweeperBoard => {
  const previousCell = board[x][y];
  if (previousCell.isMine) {
    throw new Error('Game Over!');
  } else if (previousCell.isUndiscoveredEmpty) {
    const newBoard = [...board];
    newBoard[x] = [...newBoard[x]];
    newBoard[x][y] = previousCell.update({ isDiscovered: true });
    // TODO: clear surrounding area.
    return newBoard;
  }
  return board;
}

const markCell = (board: MinesweeperBoard, [x, y]: Vector): MinesweeperBoard => {
  const previousCell = board[x][y];
  if (!previousCell.isDiscovered) {
    return updateBoardCell(board, [x, y], previousCell.update({ isMarked: !previousCell.isMarked }))
  }
  return board;
};

const getNewBoard = (board: MinesweeperBoard, action: CellAction): MinesweeperBoard => {
  const { type, cell } = action;
  if (type === 'discover') {
    return clearCells(board, cell);
  } else if (type === 'mark') {
    return markCell(board, cell);
  }
  return board;
};

const minesweeperGameLoop = (action: Observable<CellAction>) => action.pipe(
  // TODO: Generate new random mines on retry.
  scan(getNewBoard, getBoard(placeRandomMines(MINE_COUNT))),
  startWith(getBoard()),
  retry(),
)

// Display Logic

const GameCell = (
  cell: Observable<MinesweeperCell>,
  index: Observable<number>,
  onCellAction: (action: CellAction) => void,
) => {
  const { neighbors, isDiscovered, hasNeighbors } = destructure(cell);

  const handleCellAction = (type: CellActionType) => using(index, index => () => onCellAction({
    type,
    cell: indexToVector(index),
  }))

  return Div(
    conditional(andGate(isDiscovered, hasNeighbors), neighbors),
  ).pipe(
    styles({
      height: '20px',
      width: '20px',
      backgroundColor: using(cell, ({ color }) => color),
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
