import { Observable, OperatorFunction, of } from 'rxjs';
import { map, distinctUntilChanged, pluck, switchMap, withLatestFrom } from 'rxjs/operators';

/**
 * Default config for shareReplay operator. Buffer size of 1 and ref count enabled to unsubscribe source when there
 * are no subscribers.
 */
export const SHARE_REPLAY_CONFIG = { bufferSize: 1, refCount: true };

/**
 * An observable operator to watch a given part of a source observable defined by the watchingFunction.
 * @param wathchingFunction A function mapping the source type (T) to the part of interest (U).
 * @returns An observable emitting the desired part of the source whenever it changes.
 */
export function watch<T, U>(
  wathchingFunction: (item: T) => U,
): OperatorFunction<T, U> {
  return (input: Observable<T>) => input.pipe(
    map(wathchingFunction),
    distinctUntilChanged(),
  );
}

/**
 * An observable operator to select a given key from a source observable stream.
 * @param key A key (K) bolonging to the source type (T).
 * @returns An observable emitting the value of T[K] whenever it changes.
 */
export function select<T, K extends keyof T>(
  key: K,
): OperatorFunction<T, T[K]> {
  return (input: Observable<T>) => input.pipe(
    pluck(key),
    distinctUntilChanged(),
  );
}

/**
 * An observable operator to only emit from the source stream of type T, if some of its attributes have changed.
 */
export function distinctUntilKeysChanged<T>(): OperatorFunction<T, T> {
  return (source: Observable<T>) => source.pipe( // TODO: Also emit if prev and curr keys lengths have changed?
    distinctUntilChanged((prev, curr) => !Object.keys(prev).some(key => curr[key] !== prev[key])),
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
    map(([_, latest]) => latest),
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
