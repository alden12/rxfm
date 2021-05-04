import { Observable } from "rxjs";
import { MinesweeperBoard } from "./minesweeper-board";
import { GameStage, CellAction } from "../types";
interface MinesweeperGameState {
    board: MinesweeperBoard;
    startTime: number | undefined;
    endTime: number | undefined;
    gameStage: GameStage;
}
export declare const minesweeperGameLoop: (action: Observable<CellAction>) => Observable<MinesweeperGameState>;
export {};
