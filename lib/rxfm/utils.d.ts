import { Observable, OperatorFunction } from 'rxjs';
export interface Dictionary<T> {
    [key: string]: T;
}
export declare type NullLike = null | undefined | false;
export declare type StringLike = string | number;
/**
 * Default config for shareReplay operator. Buffer size of 1 and ref count enabled to unsubscribe source when there
 * are no subscribers.
 */
export declare const REF_COUNT: {
    bufferSize: 1;
    refCount: true;
};
/**
 * An observable operator to watch a given part of a source observable defined by the watchingFunction.
 * @param watchingFunction A function mapping the source type (T) to the part of interest (U).
 * @returns An observable emitting the desired part of the source whenever it changes.
 */
export declare function watch<T, U>(watchingFunction: (item: T) => U): OperatorFunction<T, U>;
export declare function watchFrom<T, U>(input: Observable<T>, watchingFunction: (item: T) => U): Observable<U>;
/**
 * An observable operator to select a given key from a source observable stream.
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
/**
 * An observable operator to only emit from the source stream of type T, if some of its attributes have changed.
 */
export declare function distinctUntilKeysChanged<T>(): OperatorFunction<T, T>;
/**
 * An observable operator taking a boolean stream, when the stream emits true the operator maps to the 'source' stream
 * provided as an argument, when false, emits undefined.
 * @param source The stream to emit when the gate is in the true position.
 * @returns An observable emitting the given stream when the source is true and undefined otherwise.
 */
export declare function gate<T>(source: Observable<T>): OperatorFunction<boolean, T | undefined>;
/**
 * An observable operator to map an emission from the source stream to the latest value emitted by the given
 * 'latestFrom' stream.
 * @param latestFrom The stream to emit the latest value from.
 * @returns An observable emitting the latest value from the given stream each time the source emits.
 */
export declare function mapToLatest<T, U>(latestFrom: Observable<U>): OperatorFunction<T, U>;
/**
 * An observable operator taking a boolean stream, when the stream emits true, emit the value provided in the 'mapTo'
 * argument, when the source is false, emit undefined.
 * @param mapTo The value to emit when the source stream is true.
 * @returns The value of 'mapTo' when the source stream is true and undefined otherwise.
 */
export declare function conditionalMapTo<T>(mapTo: T): OperatorFunction<boolean, T | undefined>;
/**
 * An observable operator taking an Event object, stopping propagation on the event, and passing it through.
 */
export declare function stopPropagation<T extends Event>(): OperatorFunction<T, T>;
export declare function log<T = unknown>(message?: string): OperatorFunction<T, T>;
export declare function ternary<T, OT>(input: Observable<T>, trueValue: OT): Observable<OT | undefined>;
export declare function ternary<T, OT, OF>(input: Observable<T>, trueValue: OT, falseValue: OF): Observable<OT | OF>;
export declare function filterObject<T extends object>(object: T, filterFn: <K extends keyof T = keyof T>(value: T[K], key: K) => boolean): Partial<T>;
export declare function coerceToObservable<T>(value: T | Observable<T>): Observable<T>;
export declare function coerceToArray<T>(value: T | T[]): T[];
export declare function flatten<T>(notFlat: T[][]): T[];
