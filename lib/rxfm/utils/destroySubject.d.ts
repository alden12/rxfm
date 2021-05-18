import { ReplaySubject } from "rxjs";
export declare class DestroySubject extends ReplaySubject<void> {
    constructor();
    emitAndComplete: () => void;
}
