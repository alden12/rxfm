import { Observable } from "rxjs";
import { MinesweeperBoard } from "../game-logic/minesweeper-board";
import { CellAction } from "../types";
export declare const GameBoard: (board: Observable<MinesweeperBoard>, onCellAction: (action: CellAction) => void) => Observable<HTMLDivElement>;
