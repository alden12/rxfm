import { Observable } from "rxjs";
export declare type DestructuredObservable<T> = {
    [K in keyof T]: Observable<T[K]>;
};
export declare function destructure<T>(source: Observable<T>): DestructuredObservable<T>;
export declare function using<T, U>(source: Observable<T>, action: (value: T) => U): Observable<U>;
export declare function conditional<T, S, F = undefined>(source: Observable<T>, successValue: S | Observable<S>, failValue?: F | Observable<F>): Observable<S | F>;
export declare function reuse<T>(source: Observable<T>): Observable<T>;
