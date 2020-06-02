import { Observable, OperatorFunction, of } from 'rxjs';
import { map, distinctUntilChanged, pluck, switchMap, withLatestFrom, tap } from 'rxjs/operators';
import { EventType } from './components';

export type EventKeys<T extends EventType> = T extends EventType<infer K, any> ? K : never;

export type EventValue<T extends EventType, K extends EventKeys<T>> = T extends EventType<K, infer V> ? V : never;

export type EventGet<T extends EventType, K extends string> = T extends EventType<K, any> ? EventType<K, T[K]> : never;

export type EventDelete<T extends EventType, K extends string> = T extends EventType<K, any> ? never : T;

export interface Dictionary<T> { [key: string]: T }

/**
 * Default config for shareReplay operator. Buffer size of 1 and ref count enabled to unsubscribe source when there
 * are no subscribers.
 */
export const SHARE_REPLAY_CONFIG = { bufferSize: 1 as 1, refCount: true as true };

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
// export function select<T, K extends keyof T>(): OperatorFunction<T, any>
export function select<T, K extends keyof T>(key: K): OperatorFunction<T, T[K]>
export function select<T, K0 extends keyof T, K1 extends keyof T[K0]>(key0: K0, key1: K1): OperatorFunction<T, T[K0][K1]>
export function select<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1]>(key0: K0, key1: K1, key2: K2): OperatorFunction<T, T[K0][K1][K2]>
export function select<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1], K3 extends keyof T[K0][K1][K2]>(key0: K0, key1: K1, key2: K2, key3: K3): OperatorFunction<T, T[K0][K1][K2][K3]>
// tslint:enable: max-line-length
export function select<T>(...keys: string[]): OperatorFunction<T, any> {
  return (input: Observable<T>) => input.pipe(
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
    pluck(...keys),
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

/**
 * An observable operator taking an Event object, stopping propagation on the event, and passing it through.
 */
export function stopPropagation<T extends Event>(): OperatorFunction<T, T> {
  return (source: Observable<T>) => source.pipe(
    tap(ev => ev.stopPropagation()),
  );
}

export function log<T>(message?: string): OperatorFunction<T, T> {
  return (input: Observable<T>) => input.pipe(
    tap(val => message ? console.log(message, val) : console.log(val)),
  );
}

export function filterObject<T extends object>(
  object: T,
  filterFn: <K extends keyof T = keyof T>(value: T[K], key: K) => boolean,
): Partial<T> {
  return Object.keys(object).reduce((filtered, key) => {
    if (filterFn(object[key], key as keyof T)) {
      filtered[key] = object[key];
    }
    return filtered;
  }, {} as Partial<T>)
}

export function coerceToObservable<T>(value: T | Observable<T>): Observable<T> {
  return value instanceof Observable ? value : of(value);
}

// export function activeCombineLatest<T>(): OperatorFunction<Map<string | number, Observable<T>>, T[]> {
//   return (map$: Observable<Map<string | number, Observable<T>>>) => {
//     const itemMap = new Map<string | number, T>();

//     return map$.pipe(
//       switchMap(itemObservableMap => {
//         const addedItems = Array.from(itemObservableMap.entries())
//           .filter(([id]) => !itemMap.has(id));

//         const removed = Array.from(itemMap.keys()).filter(id => !itemObservableMap.has(id));

//         removed.forEach(id => itemMap.delete(id));

//         return from([
//           ...addedItems.map(([id, item$]) => item$.pipe(
//             tap(item => itemMap.set(id, item)),
//           )),
//           of(Array.from(itemObservableMap.keys())).pipe(
//             map(ids => ids.map(id => itemMap.get(id)!))
//           ),
//         ]);
//       }),
//       mergeAll(),
//       filter(compOrCompArray => Array.isArray(compOrCompArray)),
//       map(compOrCompArray => compOrCompArray as T[])
//     );
//   }
// }

// export function generate<T, U>(
//   idFunction: (item: T) => string | number,
//   creationFunction: (item: Observable<T>) => Observable<U>,
// ): OperatorFunction<T[], U[]> {

//   // const updates: Observable<Map<string | number, T>>
//   // const removed: Observable<Set<string | number>>
//   // const resultObservables: Observable<Map<string | number, Observable<U>>>

//   return (items$: Observable<T[]>) => {

//     let previousItemMap = new Map<string | number, T>();
//     const changes = items$.pipe(
//       map(items => {
//         const itemsAndIds = items.map(item => [idFunction(item), item] as const);
//         const updated = new Map(itemsAndIds.filter(([id]) => previousItemMap.has(id)));
//         const removed = new Set(Array.from(previousItemMap.keys()).filter(id => !itemMap.has(id)));
//         const itemMap = new Map(itemsAndIds);
//         previousItemMap = itemMap;
//         return { updated, removed, itemMap };
//       }),
//       shareReplay(SHARE_REPLAY_CONFIG),
//     );

//     let previousResultMap = new Map<string | number, Observable<U>>();
//     const resultObservableMap = changes.pipe(
//       map(({ itemMap }) => {

//         const resultsAndIds = Array.from(itemMap.entries()).map(([id, item]) => {
//           if (previousResultMap.has(id)) {
//             return [id, previousResultMap.get(id)!] as const;
//           } else {
//             const updates = changes.pipe(
//               filter(({ updated }) => updated.has(id)),
//               map(({ updated }) => updated.get(id) as T),
//               startWith(item),
//               distinctUntilChanged(),
//               takeUntil(changes.pipe(
//                 filter(({ removed }) => removed.has(id)),
//               )),
//             );
//             return [id, creationFunction(updates)] as const;
//           }
//         });

//         const resultMap = new Map(resultsAndIds);
//         previousResultMap = resultMap;
//         return resultMap;
//       })
//     );

//     return resultObservableMap.pipe(
//       activeCombineLatest(),
//     )
//   };
// }
