import { MinesweeperCell } from "./minesweeper-cell";
import { Vector } from "../types";
export declare type MinesweeperBoard = MinesweeperCell[][];
export declare const setCellNeighbors: (board: MinesweeperBoard, [x, y]: Vector) => void;
export declare const getEmptyBoard: () => MinesweeperBoard;
export declare const clearEmptyCells: (board: MinesweeperBoard, [x, y]: Vector, clone?: boolean) => MinesweeperBoard;
export declare const clearNeighbors: (board: MinesweeperBoard, [x, y]: Vector) => MinesweeperBoard | null;
export declare const revealMines: (board: MinesweeperBoard, exploded: boolean) => MinesweeperBoard;
export declare const allCleared: (board: MinesweeperBoard) => boolean;
