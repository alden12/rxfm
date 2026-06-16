// Pure domain logic for Snake — no RxJS, no reactivity. Everything here is
// ordinary imperative/value code: the trail data structure, the rules for
// advancing a tick, board construction, food placement. In the Reactive TS version ALL
// of the reactive wiring lives in the view (snake-game.rts); this module is just
// the rules of the game.
import {
  DIRECTION_MAP,
  STARTING_SNAKE_COORDS,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  DIFFICULTY_SCORE_MAP,
  DIFFICULTY_TICK_PERIOD_MAP,
} from "./constants";
import { Vector, Direction, SnakeBoard, Difficulty } from "./types";

const vectorsAreEqual = ([x1, y1]: Vector, [x2, y2]: Vector) =>
  x1 === x2 && y1 === y2;

class SnakeNode {
  public next?: SnakeNode;

  constructor(
    public coordinates: Vector,
    ...tailCoords: Vector[]
  ) {
    this.next = tailCoords.length
      ? new SnakeNode(...(tailCoords as [Vector, ...Vector[]]))
      : undefined;
  }
}

const getSnakeHead = (node: SnakeNode): SnakeNode =>
  node.next ? getSnakeHead(node.next) : node;

const getSnakeCoords = ({ coordinates, next }: SnakeNode): Vector[] => [
  coordinates,
  ...(next ? getSnakeCoords(next) : []),
];

class SnakeTrail {
  private head: SnakeNode;

  constructor(
    private tail: SnakeNode,
    head?: SnakeNode,
  ) {
    this.head = head || getSnakeHead(this.tail);
  }

  public get coordinates() {
    return getSnakeCoords(this.tail);
  }

  public get headCoordinates() {
    return this.head.coordinates;
  }

  public grow(direction: Direction): SnakeTrail {
    const newHead = new SnakeNode(
      this.headCoordinates.map(
        (value, i) => value + DIRECTION_MAP[direction][i],
      ) as Vector,
    );
    this.head.next = newHead;
    return new SnakeTrail(this.tail, newHead);
  }

  public shrink() {
    return new SnakeTrail(this.tail.next!, this.head);
  }
}

const getInitialTrail = () =>
  new SnakeTrail(new SnakeNode(...STARTING_SNAKE_COORDS));

const checkTrailCollision = (coords: Vector[]): boolean => {
  const [x, y] = coords[coords.length - 1]; // Head coordinates
  const collidesSelf = coords
    .slice(0, -1)
    .some((coord) => vectorsAreEqual(coord, [x, y]));
  return (
    collidesSelf || x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT
  );
};

export const getBoard = (trail: Vector[], food?: Vector): SnakeBoard => {
  const board = Array(BOARD_WIDTH)
    .fill(undefined)
    .map(() => Array(BOARD_HEIGHT).fill("empty"));
  trail.forEach(([x, y]) => (board[x][y] = "trail"));
  if (food) board[food[0]][food[1]] = "food";
  return board;
};

const placeRandomFood = (trail: Vector[]): Vector => {
  const emptyCells = getBoard(trail)
    .map((column, x) =>
      column.map((cell, y): Vector | null =>
        cell === "empty" ? [x, y] : null,
      ),
    )
    .flat()
    .filter((cell) => Array.isArray(cell)) as Vector[];
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

export interface SnakeState {
  trail: SnakeTrail;
  food: Vector;
  score: number;
}

export const getInitialSnakeState = (): SnakeState => ({
  trail: getInitialTrail(),
  food: placeRandomFood(STARTING_SNAKE_COORDS),
  score: 0,
});

// Advance one tick. Returns the next state, or `null` on game over (collision) —
// the caller decides how to restart. (The original RxJS version threw 'Game Over!'
// and relied on retry(); returning null lets the Reactive TS loop reset imperatively in
// its reducer.)
export const getNewSnakeState = (
  previousState: SnakeState,
  direction: Direction,
  difficulty: Difficulty,
  tick: number,
): SnakeState | null => {
  // Not a tick for this difficulty; no state change.
  if (tick % DIFFICULTY_TICK_PERIOD_MAP[difficulty] !== 0) return previousState;
  const newState: SnakeState = {
    ...previousState,
    trail: previousState.trail.grow(direction),
  };
  if (vectorsAreEqual(newState.trail.headCoordinates, previousState.food)) {
    newState.food = placeRandomFood(newState.trail.coordinates);
    newState.score = previousState.score + DIFFICULTY_SCORE_MAP[difficulty];
  } else {
    newState.trail = newState.trail.shrink();
  }
  if (checkTrailCollision(newState.trail.coordinates)) return null;
  return newState;
};
