import { andGate, conditional, destructure, Div, event, flatten, mapToComponents, styles, using } from 'rxfm';
import { Observable, Subject } from 'rxjs';
import { map, retry, scan, startWith } from 'rxjs/operators';

// Types:

type MinesweeperBoard = MinesweeperCell[][];
type MinesweeperCellType = 'cleared' | 'undiscoveredEmpty' | 'undiscoveredMine' | 'markedMine' | 'markedEmpty' | 'explodedMine' | 'mine';
type Vector = [number, number]; // [x, y]

type CellActionType = 'discover' | 'mark' | 'start';

interface CellAction {
  type: CellActionType;
  cell: Vector;
}

// Constants:

const BOARD_WIDTH = 15;
const BOARD_HEIGHT = 8;

const MINE_COUNT = 12;

const CELL_COLOR_MAP: Record<MinesweeperCellType, string> = {
  cleared: 'darkgrey',
  undiscoveredEmpty: 'grey',
  undiscoveredMine: 'grey',
  markedMine: 'grey',
  markedEmpty: 'grey',
  explodedMine: 'red',
  mine: 'darkgrey',
};

const CELL_SYMBOL_MAP: Partial<Record<MinesweeperCellType, string>> = {
  mine: '💣',
  markedEmpty: '🚩',
  markedMine: '🚩',
  explodedMine: '💥',
};

const NEIGHBORS_COLOR_MAP: Record<number, string> = {
  1: 'blue',
  2: 'green',
  3: 'red',
  4: 'purple',
  5: 'black',
  6: 'grey',
  7: 'maroon',
  8: 'turquoise',
};

const NEIGHBOR_VECTORS: Vector[] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
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
    return this.typeIsOneOf('undiscoveredMine', 'markedMine', 'explodedMine', 'mine');
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

  public get symbol(): string | undefined {
    return CELL_SYMBOL_MAP[this.type];
  }

  public updateType(newType: MinesweeperCellType): MinesweeperCell {
    return new MinesweeperCell(newType, this.neighbors);
  }

  public updateNeighbors(neighbors: number): MinesweeperCell {
    return new MinesweeperCell(this.type, neighbors);
  }

  public clear() {
    return new MinesweeperCell('cleared', this.neighbors);
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
const vectorToIndex = (vector: Vector): number => vector[0] * BOARD_HEIGHT + vector[1];

// TODO: Take initial click coord and exclude this from possible mines.
const placeRandomMines = (count: number, startingCell: Vector): Vector[] => {
  const boardSize = BOARD_WIDTH * BOARD_HEIGHT;
  const mineIndices = new Set<number>();
  const startingCellIndex = vectorToIndex(startingCell);
  while (mineIndices.size < count) {
    const randomIndex = Math.floor(Math.random() * boardSize);
    if (randomIndex !== startingCellIndex) mineIndices.add(randomIndex);
  }
  return Array.from(mineIndices).map(indexToVector);
};

const getOffsetCell = (board: MinesweeperBoard, cell: Vector, offset: Vector): MinesweeperCell | undefined => {
  return board[cell[0] + offset[0]] ? board[cell[0] + offset[0]][cell[1] + offset[1]] : undefined;
}

const setCellNeighbors = (board: MinesweeperBoard, [x, y]: Vector) => {
  const neighboringCells = NEIGHBOR_VECTORS.map(vector => getOffsetCell(board, [x, y], vector));
  const neighbors = neighboringCells.reduce((count, cell) => cell ? count + Number(Boolean(cell.isMine)) : count, 0);
  board[x][y] = board[x][y].updateNeighbors(neighbors);
}

const getEmptyBoard = (): MinesweeperBoard => Array(BOARD_WIDTH)
  .fill(undefined)
  .map(() => Array(BOARD_HEIGHT).fill(undefined).map(() => new MinesweeperCell()));

const cloneBoard = (board: MinesweeperBoard) => board.map(column => [...column]);

const clearEmptyCells = (board: MinesweeperBoard, [x, y]: Vector): MinesweeperBoard => {
  const cell = board[x][y];
  if (cell.isUndiscoveredEmpty) {
    board[x][y] = cell.clear();
    if (cell.neighbors === 0) {
      NEIGHBOR_VECTORS.forEach(vector => {
        const offsetCell = getOffsetCell(board, [x, y], vector);
        if (offsetCell && offsetCell.isUndiscoveredEmpty) clearEmptyCells(board, [x + vector[0], y + vector[1]]);
      });
    }
  }
  return board;
}

class MinesweeperGame {
  private actionMap: Record<CellActionType, (cell: Vector) => MinesweeperGame> = {
    discover: (cell: Vector) => this.clearCells(cell),
    mark: (cell: Vector) => this.toggleMarked(cell),
    start: (cell: Vector) => this.placeMines(cell),
  };

  constructor(
    public board = getEmptyBoard(),
  ) {}

  public update(action: CellAction) {
    const { type, cell } = action;
    return this.actionMap[type](cell);
  }

  private placeMines(startingCell: Vector) {
    const board = getEmptyBoard();
    const mines = placeRandomMines(MINE_COUNT, startingCell);
    mines.forEach(([x, y]) => board[x][y] = new MinesweeperCell('undiscoveredMine'));
    board.forEach((column, x) => column.forEach((_, y) => setCellNeighbors(board, [x, y])))
    return new MinesweeperGame(board).clearCells(startingCell);
  }

  private clearCells([x, y]: Vector) {
    const previousCell = this.board[x][y];
    if (previousCell.isMine) {
      throw new Error('Game Over!');
    } else if (previousCell.isUndiscoveredEmpty) {
      const newBoard = cloneBoard(this.board);
      clearEmptyCells(newBoard, [x, y]);
      return new MinesweeperGame(newBoard);
    }
    return this;
  }

  private toggleMarked([x, y]: Vector) {
    const previousCell = this.board[x][y];
    if (!previousCell.isDiscovered) {
      return this.updateCell([x, y], previousCell.toggleMarked())
    }
    return this;
  }

  private updateCell([x, y]: Vector, newCell: MinesweeperCell) {
    const newBoard = [...this.board];
    newBoard[x] = [...newBoard[x]];
    newBoard[x][y] = newCell;
    return new MinesweeperGame(newBoard);
  }
}

const minesweeperGameLoop = (action: Observable<CellAction>) => action.pipe(
  map((action, i) => i === 0 ? { type: 'start' as const, cell: action.cell } : action),
  scan((board, action) => board.update(action), new MinesweeperGame()),
  map(({ board }) => board),
  startWith(getEmptyBoard()),
  retry(),
)

// Display Logic

const GameCell = (
  cell: Observable<MinesweeperCell>,
  index: Observable<number>,
  onCellAction: (action: CellAction) => void,
) => {
  const { neighbors, isDiscovered, symbol, hasNeighbors, color } = destructure(cell);

  const handleCellAction = (type: CellActionType) => using(index, index => () => onCellAction({
    type,
    cell: indexToVector(index),
  }))

  return Div(
    conditional(
      andGate(isDiscovered, hasNeighbors),
      neighbors,
      symbol,
    ),
  ).pipe(
    styles({
      height: '16px',
      width: '16px',
      backgroundColor: color,
      color: using(neighbors, neighbors => NEIGHBORS_COLOR_MAP[neighbors]),
      fontWeight: 'bold',
      fontSize: using(symbol, symbol => symbol ? '12px' : '14px'),
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
  const cellAction = new Subject<CellAction>();

  return Div(
    GameBoard(
      minesweeperGameLoop(cellAction),
      action => cellAction.next(action),
    ),
  );
};
