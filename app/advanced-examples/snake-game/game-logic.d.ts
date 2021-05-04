import { Observable } from "rxjs";
import { SnakeBoard, Difficulty } from "./types";
export declare const snakeGameLoop: (difficulty: Observable<Difficulty>) => Observable<{
    board: SnakeBoard;
    score: number;
}>;
