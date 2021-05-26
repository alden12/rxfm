import { Observable, ReplaySubject } from "rxjs";
export declare class DestroySubject extends ReplaySubject<void> {
    constructor();
    next: () => void;
    complete: () => void;
    destroy: () => void;
    untilDestroy: <T>(source: Observable<T>) => Observable<T>;
    toPromise: () => Promise<void>;
}
