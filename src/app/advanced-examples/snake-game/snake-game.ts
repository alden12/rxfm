import { Div, event, styles, using, flatten, mapToComponents, Button, destructure, reuse, classes } from "rxfm";
import { Observable, BehaviorSubject } from "rxjs";
import { map, scan } from "rxjs/operators";
import { CELL_COLOR_MAP, BOARD_HEIGHT } from "./constants";
import { snakeGameLoop } from "./game-logic";
import { SnakeCell, SnakeBoard, Difficulty } from "./types";

import './snake-styles.css';

const GameCell = (cellType: Observable<SnakeCell>) => Div().pipe(
  classes('snake-cell'),
  styles({ backgroundColor: using(cellType, cellType => CELL_COLOR_MAP[cellType]) }),
);

const GameBoard = (board: Observable<SnakeBoard>) => Div(
  board.pipe(
    map(flatten),
    mapToComponents((_, i) => i, GameCell),
  ),
).pipe(
  classes('snake-game-board'),
  styles({ gridTemplateRows: `repeat(${BOARD_HEIGHT}, max-content)` }),
);

type SetDifficulty = (difficulty: Difficulty) => void;

const DifficultyButton = (difficulty: Difficulty, setDifficulty: SetDifficulty) => Button(difficulty).pipe(
  event('click', () => setDifficulty(difficulty)),
  classes('difficulty-button'),
);

const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const ScoreBoard = (score: Observable<number>, setDifficulty: SetDifficulty) => {
  const highScore = score.pipe(
    scan((highScore, score) => Math.max(highScore, score), 0),
  );

  return Div(
    Div`Score: ${score}`,
    Div`High Score: ${highScore}`,
    ...difficulties.map(difficulty => DifficultyButton(difficulty, setDifficulty)),
  ).pipe(
    classes('score-board'),
  );
}

export const SnakeGame = () => {
  const difficulty = new BehaviorSubject<Difficulty>('Easy');
  const { board, score } = destructure(reuse(snakeGameLoop(difficulty)));

  return Div(
    GameBoard(board),
    ScoreBoard(score, newDifficulty => difficulty.next(newDifficulty)),
  ).pipe(
    classes('snake-game'),
  );
};
