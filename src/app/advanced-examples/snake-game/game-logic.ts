import { flatten } from "rxfm";
import { fromEvent, Observable, timer } from "rxjs";
import { filter, map, startWith, switchMap, withLatestFrom, scan, retry } from "rxjs/operators";
import {
  DIRECTION_MAP,
  STARTING_SNAKE_COORDS,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  DIFFICULTY_SCORE_MAP,
  KEY_MAP,
  DIFFICULTY_TICK_PERIOD_MAP,
} from "./constants";
import { Vector, Direction, SnakeBoard, Difficulty } from "./types";

const vectorsAreEqual = ([x1, y1]: Vector, [x2, y2]: Vector) => x1 === x2 && y1 === y2;

class SnakeNode {
  public next?: SnakeNode;

  constructor(public coordinates: Vector, ...tailCoords: Vector[]) {
    this.next = tailCoords.length ? new SnakeNode(...tailCoords as [Vector, ...Vector[]]) : undefined;
  }
}

const getSnakeHead = (node: SnakeNode): SnakeNode => node.next ? getSnakeHead(node.next) : node;

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
  map(ev => KEY_MAP[(ev as KeyboardEvent).code]),
  startWith('right' as Direction),
);

export const snakeGameLoop = (difficulty: Observable<Difficulty>) => difficulty.pipe(
  switchMap(difficulty => timer(0, DIFFICULTY_TICK_PERIOD_MAP[difficulty])),
  withLatestFrom(keyDirection, difficulty),
  scan((state, [, direction, difficulty]) => getNewSnakeState(state, direction, difficulty), getInitialSnakeState()),
  map(({ trail, food, score }) => ({ board: getBoard(trail.coordinates, food), score })),
  retry(),
);
