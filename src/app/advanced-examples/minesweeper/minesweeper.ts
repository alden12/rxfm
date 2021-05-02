import { andGate, conditional, destructure, Div, event, flatten, mapToComponents, styles, using } from 'rxfm';
import { Observable, Subject } from 'rxjs';
import { map, retry, scan, startWith } from 'rxjs/operators';

// Types:

type MinesweeperBoard = MinesweeperCell[][];
type MinesweeperCellType = 'cleared' | 'undiscoveredEmpty' | 'undiscoveredMine' | 'markedMine' | 'markedEmpty' | 'explodedMine';
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
  explodedMine: 'red',
};

const DIRECT_NEIGHBOR_VECTORS: Vector[] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];
const ALL_NEIGHBOR_VECTORS: Vector[] = [
  ...DIRECT_NEIGHBOR_VECTORS,
  [-1, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
];

// Game Logic:

class MinesweeperCell {
  constructor(
    private type: MinesweeperCellType = 'undiscoveredEmpty',
    public neighbors = 0,
  ) {}

  public get isMine(): boolean {
    return this.typeIsOneOf('undiscoveredMine', 'markedMine', 'explodedMine');
  }

  public get isDiscovered(): boolean {
    return this.type === 'cleared';
  }

  public get isUndiscoveredEmpty(): boolean {
    return this.type === 'undiscoveredEmpty';
  }

  public get hasNeighbors(): boolean {
    return this.neighbors > 0;
  }

  public get color(): string {
    return CELL_COLOR_MAP[this.type];
  }

  public updateType(newType: MinesweeperCellType): MinesweeperCell {
    return new MinesweeperCell(newType, this.neighbors);
  }

  public updateNeighbors(neighbors: number): MinesweeperCell {
    return new MinesweeperCell(this.type, neighbors);
  }

  public toggleMarked(): MinesweeperCell {
    switch(this.type) {
      case ('undiscoveredEmpty'):
        return this.updateType('markedEmpty');
      case ('markedEmpty'):
        return this.updateType('undiscoveredEmpty');
      case ('undiscoveredMine'):
        return this.updateType('markedMine');
      case ('markedMine'):
        return this.updateType('undiscoveredMine');
      default:
        return this;
    }
  }

  private typeIsOneOf(...types: MinesweeperCellType[]): boolean {
    return types.some(type => this.type === type);
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

const getOffsetCell = (board: MinesweeperBoard, cell: Vector, offset: Vector): MinesweeperCell | undefined => {
  return board[cell[0] + offset[0]] ? board[cell[0] + offset[0]][cell[1] + offset[1]] : undefined;
}

const setCellNeighbors = (board: MinesweeperBoard, [x, y]: Vector) => {
  const neighboringCells = ALL_NEIGHBOR_VECTORS.map(vector => getOffsetCell(board, [x, y], vector));
  const neighbors = neighboringCells.reduce((count, cell) => cell ? count + Number(Boolean(cell.isMine)) : count, 0);
  board[x][y] = board[x][y].updateNeighbors(neighbors);
}

const getEmptyBoard = (): MinesweeperBoard => Array(BOARD_WIDTH)
  .fill(undefined)
  .map(() => Array(BOARD_HEIGHT).fill(new MinesweeperCell()));

const clearEmptyCells = (board: MinesweeperBoard, cell: Vector): MinesweeperBoard => {

  return board;
}

class MinesweeperGame {
  constructor(
    public board = getEmptyBoard(),
  ) {}

  public update(action: CellAction) {
    const { type, cell } = action;
    if (type === 'discover') {
      return this.clearCells(cell);
    } else if (type === 'mark') {
      return this.markCell(cell);
    }
    return this;
  }

  public static placeMines() {
    const board = getEmptyBoard();
    const mines = placeRandomMines(MINE_COUNT);
    mines?.forEach(([x, y]) => board[x][y] = new MinesweeperCell('undiscoveredMine'));
    if (mines && mines.length) {
      board.forEach((column, x) => column.forEach((_, y) => setCellNeighbors(board, [x, y])))
    }
    return new MinesweeperGame(board);
  }

  private updateCell([x, y]: Vector, newCell: MinesweeperCell) {
    const newBoard = [...this.board];
    newBoard[x] = [...newBoard[x]];
    newBoard[x][y] = newCell;
    return new MinesweeperGame(newBoard);
  }

  private clearCells([x, y]: Vector) {
    const previousCell = this.board[x][y];
    if (previousCell.isMine) {
      throw new Error('Game Over!');
    } else if (previousCell.isUndiscoveredEmpty) {
      // TODO: clear surrounding area.
      return this.updateCell([x, y], previousCell.updateType('cleared'));
    }
    return this;
  }

  private markCell([x, y]: Vector) {
    const previousCell = this.board[x][y];
    if (!previousCell.isDiscovered) {
      return this.updateCell([x, y], previousCell.toggleMarked())
    }
    return this;
  }
}

const minesweeperGameLoop = (action: Observable<CellAction>) => action.pipe(
  // TODO: Generate new random mines on retry.
  scan((board, action) => board.update(action), MinesweeperGame.placeMines()),
  startWith(new MinesweeperGame()),
  map(({ board }) => board),
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
      color: 'white',
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
