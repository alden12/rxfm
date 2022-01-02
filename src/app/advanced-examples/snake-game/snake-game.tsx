import RxFM, { flatten, mapToComponents, FC } from "rxfm";
import { Observable, BehaviorSubject } from "rxjs";
import { distinctUntilChanged, map, pluck, scan } from "rxjs/operators";
import { CELL_COLOR_MAP, BOARD_HEIGHT } from "./constants";
import { snakeGameLoop } from "./game-logic";
import { SnakeCell, SnakeBoard, Difficulty } from "./types";

import './snake-styles.css';

const GameCell: FC<{ cellType: Observable<SnakeCell> }> = ({ cellType }) =>(
  <div class="snake-cell" style={{ backgroundColor: cellType.pipe(map(cellType => CELL_COLOR_MAP[cellType])) }} />
);

const GameBoard: FC<{ board: Observable<SnakeBoard> }> = ({ board }) => <div
  class="snake-game-board"
  style={{ gridTemplateRows: `repeat(${BOARD_HEIGHT}, max-content)` }}
>
  {board.pipe(
    map(flatten),
    mapToComponents(cellType => <GameCell cellType={cellType} />),
  )}
</div>;

type SetDifficulty = (difficulty: Difficulty) => void;

interface DifficultyButtonProps {
  difficulty: Difficulty;
  setDifficulty: SetDifficulty;
}

const DifficultyButton: FC<DifficultyButtonProps> = ({ difficulty, setDifficulty }) => (
  <button class="difficulty-button" onClick={() => setDifficulty(difficulty)}>
    {difficulty}
  </button>
);

const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

interface ScoreBoardProps {
  score: Observable<number>;
  setDifficulty: SetDifficulty;
}

const ScoreBoard: FC<ScoreBoardProps> = ({ score, setDifficulty }) => {
  const highScore = score.pipe(
    distinctUntilChanged(),
    scan((highScore, score) => Math.max(highScore, score), 0),
  );

  return <div class="score-board">
    <div>Score: {score}</div>
    <div>High Score: {highScore}</div>
    {difficulties.map(difficulty => <DifficultyButton difficulty={difficulty} setDifficulty={setDifficulty} />)}
  </div>;
};

export const SnakeGame: FC = () => {
  const difficulty = new BehaviorSubject<Difficulty>('Easy');
  const snakeGame = snakeGameLoop(difficulty);

  return <div class="snake-game">
    <GameBoard board={snakeGame.pipe(pluck('board'))} />
    <ScoreBoard score={snakeGame.pipe(pluck('score'))} setDifficulty={newDifficulty => difficulty.next(newDifficulty)} />
  </div>;
};
