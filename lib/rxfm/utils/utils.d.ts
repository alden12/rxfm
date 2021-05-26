import { Observable, OperatorFunction } from "rxjs";
export declare function coerceToObservable<T>(value: T | Observable<T>): Observable<T>;
export declare function coerceToArray<T>(value: T | T[]): T[];
export declare function flatten<T>(nested: (T | T[])[]): T[];
/**
 * An observable operator to select a given key/keys from a source observable stream.
 * Equivalent to 'pluck' from RxJS operators but only emits distinct values.
 * @param key A key (K) belonging to the source type (T).
 * @returns An observable emitting the value of T[K] whenever it changes.
 */
export declare function select<T, K extends keyof T>(key: K): OperatorFunction<T, T[K]>;
export declare function select<T, K0 extends keyof T, K1 extends keyof T[K0]>(key0: K0, key1: K1): OperatorFunction<T, T[K0][K1]>;
export declare function select<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1]>(key0: K0, key1: K1, key2: K2): OperatorFunction<T, T[K0][K1][K2]>;
export declare function select<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1], K3 extends keyof T[K0][K1][K2]>(key0: K0, key1: K1, key2: K2, key3: K3): OperatorFunction<T, T[K0][K1][K2][K3]>;
export declare function selectFrom<T, K extends keyof T>(input: Observable<T>, key: K): Observable<T[K]>;
export declare function selectFrom<T, K0 extends keyof T, K1 extends keyof T[K0]>(input: Observable<T>, key0: K0, key1: K1): Observable<T[K0][K1]>;
export declare function selectFrom<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1]>(input: Observable<T>, key0: K0, key1: K1, key2: K2): Observable<T[K0][K1][K2]>;
export declare function selectFrom<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1], K3 extends keyof T[K0][K1][K2]>(input: Observable<T>, key0: K0, key1: K1, key2: K2, key3: K3): Observable<T[K0][K1][K2][K3]>;
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
 * An observable operator to watch a given part of a source observable defined by the watchingFunction.
 * Equivalent to 'map' from RxJS operators but only emits distinct values.
 * @param watchingFunction A function mapping the source type (T) to the part of interest (U).
 * @returns An observable emitting the desired part of the source whenever it changes.
 */
export declare function watch<T, U>(watchingFunction: (item: T) => U): OperatorFunction<T, U>;
/**
 * Use an observable to perform an action and return the action result.
 * This is equivalent to: `source.pipe(map(action))` but will only emit distinct values.
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
 * This is equivalent to `source.pipe(shareReplay({ bufferSize: 1, refCount: true }))` but will only emit distinct values.
 * @param source An observable of type T.
 * @returns A multicast observable which will only be subscribed once, future subscriptions will receive the same values.
 */
export declare function reuse<T>(source: Observable<T>): Observable<T>;
/**
 * Take a spread array of observables and emit the logical AND value of all of their emissions whenever it changes.
 */
export declare function andGate(...sources: Observable<any>[]): Observable<boolean>;
/**
 * Take a spread array of observables and emit the logical OR value of all of their emissions whenever it changes.
 */
export declare function orGate(...sources: Observable<any>[]): Observable<boolean>;
/**
 * @returns An observable emitting the logical NOT value of the source observable's emissions.
 */
export declare function notGate(source: Observable<any>): Observable<boolean>;
/**
 * @param sources A spread array of items or observables emitting items of type T.
 * @returns An observable emitting whether all items are equal whenever they change.
 */
export declare function equals<T>(...sources: (T | Observable<T>)[]): Observable<boolean>;
/**
 * An observable operator to console log the current value of an observable.
 * @param message A string to place before the logged value, or a function taking the value and returning a string to log.
 */
export declare function log<T = unknown>(message?: string | ((val: T) => string)): OperatorFunction<T, T extends never ? never : T>;
