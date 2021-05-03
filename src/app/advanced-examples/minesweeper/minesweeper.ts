import { andGate, Button, conditional, destructure, Div, equals, event, flatten, mapToComponents, reuse, styles, using } from 'rxfm';
import { combineLatest, Observable, of, Subject, timer } from 'rxjs';
import { filter, map, retry, scan, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

// Types:

type MinesweeperCellType = 'cleared' | 'undiscoveredEmpty' | 'undiscoveredMine' | 'markedMine' | 'markedEmpty' | 'explodedMine' | 'mine';

type GameStage = 'pregame' | 'playing' | 'gameOver' | 'win';

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

const CELL_MARKING_MAP: Partial<Record<MinesweeperCellType, MinesweeperCellType>> = {
  undiscoveredEmpty: 'markedEmpty',
  markedEmpty: 'undiscoveredEmpty',
  undiscoveredMine: 'markedMine',
  markedMine: 'undiscoveredMine',
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

const isOneOf = <T>(testValue: T, values: T[]) => values.some(value => testValue === value);

// Game Logic:

// Minesweeper cell:

class MinesweeperCell {
  constructor(
    private type: MinesweeperCellType = 'undiscoveredEmpty',
    public neighbors = 0,
  ) {}

  public get isMine(): boolean {
    return isOneOf<MinesweeperCellType>(this.type, ['undiscoveredMine', 'markedMine']);
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
    const newType = CELL_MARKING_MAP[this.type];
    return newType ? this.updateType(newType) : this;
  }
}

// Minesweeper board:

type MinesweeperBoard = MinesweeperCell[][];

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

const clearEmptyCells = (board: MinesweeperBoard, [x, y]: Vector) => {
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
}

const revealMines = (board: MinesweeperBoard, exploded: boolean): MinesweeperBoard => {
  const newBoard = cloneBoard(board);
  newBoard.forEach((column, x) => column.forEach((cell, y) => {
    if (cell.isMine) newBoard[x][y] = new MinesweeperCell(exploded ? 'explodedMine' : 'mine');
  }));
  return newBoard;
};

const allCleared = (board: MinesweeperBoard): boolean => board.every(
  column => column.every(cell => cell.isMine || cell.isDiscovered),
);

// Minesweeper game:

const indexToVector = (index: number): Vector => [Math.floor(index / BOARD_HEIGHT), index % BOARD_HEIGHT];
const vectorToIndex = (vector: Vector): number => vector[0] * BOARD_HEIGHT + vector[1];

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

class MinesweeperGame {
  private actionMap: Record<CellActionType, (cell: Vector) => MinesweeperGame> = {
    discover: (cell: Vector) => this.clearCells(cell),
    mark: (cell: Vector) => this.toggleMarked(cell),
    start: (cell: Vector) => this.placeMines(cell),
  };

  public endTime: number | undefined = undefined;

  constructor(
    public board: MinesweeperBoard,
    public startTime: number | undefined,
    public gameStage: GameStage,
  ) {
    if (gameStage === 'win') this.endTime = Date.now();
  }

  public update(action: CellAction) {
    if (isOneOf<GameStage>(this.gameStage, ['win', 'gameOver'])) return this;
    const { type, cell } = action;
    return this.actionMap[type](cell);
  }

  private placeMines(startingCell: Vector) {
    const board = getEmptyBoard();
    const mines = placeRandomMines(MINE_COUNT, startingCell);
    mines.forEach(([x, y]) => board[x][y] = new MinesweeperCell('undiscoveredMine'));
    board.forEach((column, x) => column.forEach((_, y) => setCellNeighbors(board, [x, y])))
    return new MinesweeperGame(board, Date.now(), 'playing').clearCells(startingCell);
  }

  private clearCells([x, y]: Vector) {
    const previousCell = this.board[x][y];
    if (previousCell.isMine) {
      return new MinesweeperGame(revealMines(this.board, true), this.startTime, 'gameOver');
    } else if (previousCell.isUndiscoveredEmpty) {
      const newBoard = cloneBoard(this.board);
      clearEmptyCells(newBoard, [x, y]);
      if (allCleared(newBoard)) return new MinesweeperGame(revealMines(newBoard, false), this.startTime, 'win');
      return new MinesweeperGame(newBoard, this.startTime, 'playing');
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
    return new MinesweeperGame(newBoard, this.startTime, 'playing');
  }
}

interface MinesweeperGameState {
  board: MinesweeperBoard;
  startTime: number | undefined;
  endTime: number | undefined;
  gameStage: GameStage;
}

const getStartingState = (): MinesweeperGameState => ({
  board: getEmptyBoard(),
  startTime: undefined,
  endTime: undefined,
  gameStage: 'pregame',
});

const minesweeperGameLoop = (action: Observable<CellAction>): Observable<MinesweeperGameState> => action.pipe(
  tap(({ type }) => {
    if (type === 'start') throw new Error('Restart Game');
  }),
  map((action, i) => i === 0 ? { type: 'start' as const, cell: action.cell } : action),
  scan((board, action) => board.update(action), new MinesweeperGame(getEmptyBoard(), undefined, 'pregame')),
  map(({ board, startTime, endTime, gameStage }) => ({ board, startTime, endTime, gameStage })),
  startWith(getStartingState()),
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

export const Controls = (
  startTime: Observable<number | undefined>,
  endTime: Observable<number | undefined>,
  gameStage: Observable<GameStage>,
  dispatchAction: (action: CellAction) => void,
) => {
  const gameTime = combineLatest([startTime, endTime]).pipe(
    switchMap(([start, end]) => {
      if (!start) return of(0);
      else if (!end) return timer(0, 1000);
      return of(Math.round((end - start) / 1000));
    }),
  );

  const highScore = combineLatest([startTime, endTime]).pipe(
    filter(([start, end]) => Boolean(start) && Boolean(end)),
    map(([start, end]) => Math.round((end! - start!) / 1000)),
    scan((lowestTime, time) => Math.min(lowestTime, time), Infinity),
    startWith(undefined),
    reuse,
  );

  return Div(
    Button('Restart').pipe(
      event('click', () => dispatchAction({ type: 'start', cell: [0, 0] }))
    ),
    Div('Time: ', gameTime, 's'),
    conditional(highScore, Div('Highscore: ', highScore, 's')),
    conditional(equals(gameStage, 'win'), Div('You Win!')),
    conditional(equals(gameStage, 'gameOver'), Div('Game Over!')),
  ).pipe(
    styles({
      paddingLeft: '10px',
      display: 'grid',
      alignItems: 'start',
      justifyItems: 'start',
      alignContent: 'start',
      gridGap: '10px',
    }),
  );
}

export const Minesweeper = () => {
  const cellAction = new Subject<CellAction>();
  const dispatch = (action: CellAction) => cellAction.next(action);

  const { board, startTime, endTime, gameStage } = destructure(minesweeperGameLoop(cellAction));

  return Div(
    GameBoard(board, dispatch),
    Controls(startTime, endTime, gameStage, dispatch),
  ).pipe(
    styles({ display: 'flex' })
  );
};
