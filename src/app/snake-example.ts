import { Button, destructure, Div, event, flatten, mapToComponents, reuse, styles, using } from "rxfm";
import { BehaviorSubject, fromEvent, Observable, timer } from "rxjs";
import { filter, map, retry, scan, startWith, switchMap, withLatestFrom } from "rxjs/operators";

// Types:

type SnakeCell = 'empty' | 'trail' | 'food';
type SnakeBoard = SnakeCell[][];
type Vector = [number, number]; // [x, y]
type Direction = 'up' | 'down' | 'left' | 'right';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

// Constants:

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 10;

const STARTING_SNAKE_COORDS: [Vector, ...Vector[]] = [[8, 4], [9, 4]];

const vectorsAreEqual = ([x1, y1]: Vector, [x2, y2]: Vector) => x1 === x2 && y1 === y2;

const CELL_COLOR_MAP: Record<SnakeCell, string> = {
  empty: 'lightgrey',
  trail: 'black',
  food: 'red',
};

const DIRECTION_MAP: Record<Direction, Vector> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const KEY_MAP: Record<string, Direction> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const DIFFICULTY_TICK_PERIOD_MAP: Record<Difficulty, number> = {
  Easy: 250, // ms
  Medium: 200, // ms
  Hard: 150, // ms
}

const DIFFICULTY_SCORE_MAP: Record<Difficulty, number> = {
  Easy: 10,
  Medium: 15,
  Hard: 20,
}

// Game logic:

class SnakeNode {
  public next?: SnakeNode;

  constructor(public coordinates: Vector, ...tailCoords: Vector[]) {
    this.next = tailCoords.length ? new SnakeNode(...tailCoords as [Vector, ...Vector[]]) : undefined;
  }
}

const getSnakeHead = (node: SnakeNode) => node.next ? getSnakeHead(node.next) : node;
const getSnakeCoords = ({ coordinates, next }: SnakeNode): Vector[] => [coordinates, ...(next ? getSnakeCoords(next) : [])];

class SnakeTrail {
  private head: SnakeNode;

  constructor(private tail: SnakeNode, head?: SnakeNode) {
    this.head = head || getSnakeHead(this.tail);
  }

  public get coordinates() {
    return getSnakeCoords(this.tail);
  }

  public get headCoordinates() {
    return this.head.coordinates;
  }

  public grow(direction: Direction): SnakeTrail {
    const newHead = new SnakeNode(this.headCoordinates.map((value, i) => value + DIRECTION_MAP[direction][i]) as Vector);
    this.head.next = newHead;
    return new SnakeTrail(this.tail, newHead);
  }

  public shrink() {
    return new SnakeTrail(this.tail.next!, this.head);
  }
}

const getInitialTrail = () => new SnakeTrail(new SnakeNode(...STARTING_SNAKE_COORDS));

const checkTrailCollision = (coords: Vector[]): boolean => {
  const [x, y] = coords[coords.length - 1]; // Head coordinates
  const collidesSelf = coords.slice(0, -1).some(coord => vectorsAreEqual(coord, [x, y]));
  return collidesSelf || x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT;
};

const getBoard = (trail: Vector[], food?: Vector): SnakeBoard => {
  const board = Array(BOARD_WIDTH).fill(undefined).map(() => Array(BOARD_HEIGHT).fill('empty'));
  trail.forEach(([x, y]) => board[x][y] = 'trail');
  if (food) board[food[0]][food[1]] = 'food';
  return board;
};

const placeRandomFood = (trail: Vector[]): Vector => {
  const emptyCells = flatten(
    getBoard(trail).map((column, x) => column.map((cell, y): Vector | null => cell === 'empty' ? [x, y] : null)),
  ).filter(cell => Array.isArray(cell)) as Vector[];
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

interface SnakeState {
  trail: SnakeTrail;
  food: Vector;
  score: number;
}

const getInitialSnakeState = (): SnakeState => ({
  trail: getInitialTrail(),
  food: placeRandomFood(STARTING_SNAKE_COORDS),
  score: 0,
});

const getNewSnakeState = (previousState: SnakeState, direction: Direction, difficulty: Difficulty): SnakeState => {
  const newState: SnakeState = { ...previousState, trail: previousState.trail.grow(direction) };
  if (vectorsAreEqual(newState.trail.headCoordinates, previousState.food)) {
    newState.food = placeRandomFood(newState.trail.coordinates);
    newState.score = previousState.score + DIFFICULTY_SCORE_MAP[difficulty];
  } else {
    newState.trail = newState.trail.shrink();
  }
  if (checkTrailCollision(newState.trail.coordinates)) throw new Error('Game Over!');
  return newState;
};

const keyDirection = fromEvent(document, 'keydown').pipe(
  filter(ev => ev instanceof KeyboardEvent && ev.code in KEY_MAP),
  map((ev: KeyboardEvent) => KEY_MAP[ev.code]),
  startWith('right' as Direction),
);

const snakeGame = (difficulty: Observable<Difficulty>) => difficulty.pipe(
  switchMap(difficulty => timer(0, DIFFICULTY_TICK_PERIOD_MAP[difficulty])),
  withLatestFrom(keyDirection, difficulty),
  scan((state, [_, direction, difficulty]) => getNewSnakeState(state, direction, difficulty), getInitialSnakeState()),
  map(({ trail, food, score }) => ({ board: getBoard(trail.coordinates, food), score })),
  retry(),
);

// Display logic:

const Cell = (cellType: Observable<SnakeCell>) => Div().pipe(
  styles({
    height: '10px',
    width: '10px',
    backgroundColor: using(cellType, cellType => CELL_COLOR_MAP[cellType]),
  }),
);

const GameBoard = (board: Observable<SnakeBoard>) => Div(
  board.pipe(
    map(flatten),
    mapToComponents((_, i) => i, Cell),
  ),
).pipe(
  styles({
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: 'max-content',
    gridTemplateRows: `repeat(${BOARD_HEIGHT}, max-content)`,
    gridGap: '2px',
  }),
);

const DifficultyButton = (difficulty: Difficulty, setDifficulty: (difficulty: Difficulty) => void) => Button(difficulty).pipe(
  event('click', () => setDifficulty(difficulty)),
  styles({ width: '90px' }),
);

const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const ScoreBoard = (score: Observable<number>, setDifficulty: (difficulty: Difficulty) => void) => {
  const highScore = score.pipe(
    scan((highScore, score) => Math.max(highScore, score), 0),
  );

  return Div(
    Div('Score: ', score),
    Div('High Score: ', highScore),
    ...difficulties.map(difficulty => DifficultyButton(difficulty, setDifficulty)),
  ).pipe(
    styles({
      paddingLeft: '10px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    })
  );
}

export const SnakeExample = () => {
  const difficulty = new BehaviorSubject<Difficulty>('Easy');
  const { board, score } = destructure(reuse(snakeGame(difficulty)));

  return Div(
    GameBoard(board),
    ScoreBoard(score, newDifficulty => difficulty.next(newDifficulty)),
  ).pipe(
    styles({ display: 'flex' }),
  );
};
