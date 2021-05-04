import { Observable } from "rxjs";
import { MinesweeperCell } from "../game-logic/minesweeper-cell";
import { CellAction } from "../types";
export declare const GameCell: (cell: Observable<MinesweeperCell>, index: Observable<number>, onCellAction: (action: CellAction) => void) => Observable<HTMLDivElement>;
