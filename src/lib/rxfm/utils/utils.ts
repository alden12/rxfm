import { Observable, OperatorFunction, of } from 'rxjs';
import { map, distinctUntilChanged, pluck, switchMap, withLatestFrom, tap } from 'rxjs/operators';

export interface Dictionary<T> { [key: string]: T }

export type NullLike = null | undefined | false;

export type StringLike = string | number;

export type TypeOrObservable<T> = T | Observable<T>;

export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>;

/**
 * Default config for shareReplay operator. Buffer size of 1 and ref count enabled to unsubscribe source when there
 * are no subscribers.
 */
export const REF_COUNT = { bufferSize: 1 as const, refCount: true as const };

/**
 * An observable operator to watch a given part of a source observable defined by the watchingFunction.
 * @param watchingFunction A function mapping the source type (T) to the part of interest (U).
 * @returns An observable emitting the desired part of the source whenever it changes.
 */
export function watch<T, U>(
  watchingFunction: (item: T) => U,
): OperatorFunction<T, U> {
  return (input: Observable<T>) => input.pipe(
    distinctUntilChanged(),
    map(watchingFunction),
    distinctUntilChanged(),
  );
}

export function watchFrom<T, U>(
  input: Observable<T>,
  watchingFunction: (item: T) => U,
): Observable<U> {
  return input.pipe(
    watch(watchingFunction),
  );
}

/**
 * An observable operator to select a given key from a source observable stream.
 * @param key A key (K) belonging to the source type (T).
 * @returns An observable emitting the value of T[K] whenever it changes.
 */
// tslint:disable: max-line-length
export function select<T, K extends keyof T>(key: K): OperatorFunction<T, T[K]>
export function select<T, K0 extends keyof T, K1 extends keyof T[K0]>(key0: K0, key1: K1): OperatorFunction<T, T[K0][K1]>
export function select<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1]>(key0: K0, key1: K1, key2: K2): OperatorFunction<T, T[K0][K1][K2]>
export function select<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1], K3 extends keyof T[K0][K1][K2]>(key0: K0, key1: K1, key2: K2, key3: K3): OperatorFunction<T, T[K0][K1][K2][K3]>
// tslint:enable: max-line-length
export function select<T>(...keys: string[]): OperatorFunction<T, any> {
  return (input: Observable<T>) => input.pipe(
    distinctUntilChanged(),
    pluck(...keys),
    distinctUntilChanged(),
  );
}

// tslint:disable: max-line-length
export function selectFrom<T, K extends keyof T>(input: Observable<T>, key: K): Observable<T[K]>
export function selectFrom<T, K0 extends keyof T, K1 extends keyof T[K0]>(input: Observable<T>, key0: K0, key1: K1): Observable<T[K0][K1]>
export function selectFrom<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1]>(input: Observable<T>, key0: K0, key1: K1, key2: K2): Observable<T[K0][K1][K2]>
export function selectFrom<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1], K3 extends keyof T[K0][K1][K2]>(input: Observable<T>, key0: K0, key1: K1, key2: K2, key3: K3): Observable<T[K0][K1][K2][K3]>
// tslint:enable: max-line-length
export function selectFrom<T>(
  input: Observable<T>,
  ...keys: string[]
): Observable<any> {
  return input.pipe(
    distinctUntilChanged(),
    pluck(...keys),
    distinctUntilChanged(),
  );
}

/**
 * An observable operator to only emit from the source stream of type T, if some of its attributes have changed.
 */
export function distinctUntilKeysChanged<T>(): OperatorFunction<T, T> {
  return (source: Observable<T>) => source.pipe( // TODO: Also emit if prev and curr keys lengths have changed?
    distinctUntilChanged((prev, curr) => !Object.keys(prev).some(key => curr[key as keyof T] !== prev[key as keyof T])),
  )
}

/**
 * An observable operator taking a boolean stream, when the stream emits true the operator maps to the 'source' stream
 * provided as an argument, when false, emits undefined.
 * @param source The stream to emit when the gate is in the true position.
 * @returns An observable emitting the given stream when the source is true and undefined otherwise.
 */
export function gate<T>(source: Observable<T>): OperatorFunction<boolean, T | undefined> {
  return (gate$: Observable<boolean>) => gate$.pipe(
    distinctUntilChanged(),
    switchMap(gatePosition => gatePosition ? source : of(undefined)),
  );
}

/**
 * An observable operator to map an emission from the source stream to the latest value emitted by the given
 * 'latestFrom' stream.
 * @param latestFrom The stream to emit the latest value from.
 * @returns An observable emitting the latest value from the given stream each time the source emits.
 */
export function mapToLatest<T, U>(latestFrom: Observable<U>): OperatorFunction<T, U> {
  return (source: Observable<T>) => source.pipe(
    withLatestFrom(latestFrom),
    map(([, latest]) => latest),
  );
}

/**
 * An observable operator taking a boolean stream, when the stream emits true, emit the value provided in the 'mapTo'
 * argument, when the source is false, emit undefined.
 * @param mapTo The value to emit when the source stream is true.
 * @returns The value of 'mapTo' when the source stream is true and undefined otherwise.
 */
export function conditionalMapTo<T>(mapTo: T): OperatorFunction<boolean, T | undefined> {
  return (source: Observable<boolean>) => source.pipe(
    map(src => src ? mapTo : undefined),
  );
}

/**
 * An observable operator taking an Event object, stopping propagation on the event, and passing it through.
 */
export function stopPropagation<T extends Event>(): OperatorFunction<T, T> {
  return (source: Observable<T>) => source.pipe(
    tap(ev => ev.stopPropagation()),
  );
}

export function log<T = unknown>(message?: string): OperatorFunction<T, T extends never ? never : T> {
  return (input: Observable<T>): Observable<T extends never ? never : T> => input.pipe(
    tap<T extends never ? never : T>(val => message ? console.log(message, val) : console.log(val)),
  );
}

export function ternary<T, OT>(
  input: Observable<T>,
  trueValue: OT,
): Observable<OT | undefined>
export function ternary<T, OT, OF>(
  input: Observable<T>,
  trueValue: OT,
  falseValue: OF,
): Observable<OT | OF>
export function ternary<T, OT, OF>(
  input: Observable<T>,
  trueValue: OT,
  falseValue?: OF,
): Observable<OT | OF | undefined> {
  return input.pipe(
    distinctUntilChanged(),
    map(ip => ip ? trueValue : falseValue)
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function filterObject<T extends object>(
  object: T,
  filterFn: <K extends keyof T = keyof T>(value: T[K], key: K) => boolean,
): Partial<T> {
  return Object.keys(object).reduce((filtered, key) => {
    if (filterFn(object[key as keyof T], key as keyof T)) {
      filtered[key as keyof T] = object[key as keyof T];
    }
    return filtered;
  }, {} as Partial<T>)
}

export function coerceToObservable<T>(value: T | Observable<T>): Observable<T> {
  return value instanceof Observable ? value : of(value);
}

export function coerceToArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function flatten<T>(nested: (T | T[])[]): T[] {
  return nested.reduce<T[]>((flat, array) => {
    flat.push(...coerceToArray(array));
    return flat;
  }, [])
}
