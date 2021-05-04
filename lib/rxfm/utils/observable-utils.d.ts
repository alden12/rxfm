import { Observable } from "rxjs";
export declare type DestructuredObservable<T> = {
    [K in keyof T]: Observable<T[K]>;
};
/**
 * Destructure properties from the source observable in a similar way to destructuring an object in normal JavaScript code.
 * @param source An observable emitting an object of type T.
 * @param share Whether or not the source observable should be shared before destructuring to prevent resubscribing the source,
 * default is true.
 * @returns An object where keys are observables emitting the corresponding property from the source observables object emissions.
 */
export declare function destructure<T>(source: Observable<T>, share?: boolean): DestructuredObservable<T>;
/**
 * Use an observable to perform an action and return the action result.
 * This is equivalent to: `source.pipe(map(action))`.
 * @param source An observable emitting payloads of type T.
 * @param action An action function taking the observables emissions and return a value of type U.
 * @returns An observable emitting the result of the action function.
 */
export declare function using<T, U>(source: Observable<T>, action: (value: T) => U): Observable<U>;
/**
 * A function taking a source observable and either emitting the success value or the fail value depending on whether
 * the source emits a truthy or falsy value.
 * @param source An observable of type T.
 * @param successValue The value of type S (or observable emitting type S) to return if T is truthy.
 * @param failValue The value of type F (or observable emitting type F) to return if T is falsy.
 * @returns Returns an observable emitting either the success value of type S or the fail value of type F depending on the
 * source observable.
 */
export declare function conditional<T, S, F = undefined>(source: Observable<T>, successValue: S | Observable<S>, failValue?: F | Observable<F>): Observable<S | F>;
/**
 * A function taking an observable of type T and returning a shared observable of the same type which will be reused
 * by any subscribers.
 * This is equivalent to `source.pipe(shareReplay({ bufferSize: 1, refCount: true }))`.
 * @param source An observable of type T.
 * @returns A multicast observable which will only be subscribed once, future subscriptions will receive the same values.
 */
export declare function reuse<T>(source: Observable<T>): Observable<T>;
export declare function andGate(...sources: Observable<any>[]): Observable<boolean>;
export declare function orGate(...sources: Observable<any>[]): Observable<boolean>;
export declare function notGate(source: Observable<any>): Observable<boolean>;
export declare function equals<T>(...sources: (T | Observable<T>)[]): Observable<boolean>;
