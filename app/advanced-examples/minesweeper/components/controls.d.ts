import { Observable } from "rxjs";
import { GameStage, CellAction } from "../types";
export declare const Controls: (startTime: Observable<number | undefined>, endTime: Observable<number | undefined>, gameStage: Observable<GameStage>, dispatch: (action: CellAction) => void) => Observable<HTMLDivElement>;
