import { combineLatest, MonoTypeOperatorFunction, Observable, of, OperatorFunction } from "rxjs";
import { distinctUntilChanged, ignoreElements, map, pluck, shareReplay, startWith, switchMap, tap } from "rxjs/operators";

export function coerceToObservable<T>(value: T | Observable<T>): Observable<T> {
  return value instanceof Observable ? value : of(value);
}

export function coerceToArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

// TODO: Deprecate once JS version has been updated to include 'flat' natively.
export function flatten<T>(nested: (T | T[])[]): T[] {
  return nested.reduce<T[]>((flat, array) => {
    flat.push(...coerceToArray(array));
    return flat;
  }, []);
}

type Nested<T> = T | Nested<T>[];

export function recursiveFlatten<T>(nested: Nested<T>): T[] {
  return coerceToArray(nested).reduce<T[]>((flat, element) => {
    const flattenedElement = Array.isArray(element) ? recursiveFlatten(element) : [element];
    flat.push(...flattenedElement);
    return flat;
  }, []);
}

/**
 * An observable operator to select a given key/keys from a source observable stream.
 * Equivalent to 'pluck' from RxJS operators but only emits distinct values.
 * @param key A key (K) belonging to the source type (T).
 * @returns An observable emitting the value of T[K] whenever it changes.
 */
// tslint:disable: max-line-length
export function select<T, K extends keyof T>(key: K): OperatorFunction<T, T[K]>;
export function select<T, K0 extends keyof T, K1 extends keyof T[K0]>(key0: K0, key1: K1): OperatorFunction<T, T[K0][K1]>;
export function select<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1]>(key0: K0, key1: K1, key2: K2): OperatorFunction<T, T[K0][K1][K2]>;
export function select<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1], K3 extends keyof T[K0][K1][K2]>(key0: K0, key1: K1, key2: K2, key3: K3): OperatorFunction<T, T[K0][K1][K2][K3]>;
// tslint:enable: max-line-length
export function select<T>(...keys: string[]): OperatorFunction<T, any> {
  return (input: Observable<T>) => input.pipe(
    distinctUntilChanged(),
    pluck(...keys),
    distinctUntilChanged(),
  );
}

// tslint:disable: max-line-length
export function selectFrom<T, K extends keyof T>(input: Observable<T>, key: K): Observable<T[K]>;
export function selectFrom<T, K0 extends keyof T, K1 extends keyof T[K0]>(input: Observable<T>, key0: K0, key1: K1): Observable<T[K0][K1]>;
export function selectFrom<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1]>(input: Observable<T>, key0: K0, key1: K1, key2: K2): Observable<T[K0][K1][K2]>;
export function selectFrom<T, K0 extends keyof T, K1 extends keyof T[K0], K2 extends keyof T[K0][K1], K3 extends keyof T[K0][K1][K2]>(input: Observable<T>, key0: K0, key1: K1, key2: K2, key3: K3): Observable<T[K0][K1][K2][K3]>;
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

export type DestructuredObservable<T> = {
  [K in keyof T]: Observable<T[K]>;
};

/**
 * Destructure properties from the source observable in a similar way to destructuring an object in normal JavaScript code.
 * @param source An observable emitting an object of type T.
 * @param share Whether or not the source observable should be shared before destructuring to prevent resubscribing the source,
 * default is true.
 * @returns An object where keys are observables emitting the corresponding property from the source observables object emissions.
 */
export function destructure<T> (source: Observable<T>, share = true): DestructuredObservable<T> {
  const sharedSource = share ? reuse(source) : source;
  const handler: ProxyHandler<DestructuredObservable<T>> = {
    get: (_, prop) => selectFrom(sharedSource, prop as keyof T),
  };
  return new Proxy({} as DestructuredObservable<T>, handler);
}

/**
 * An observable operator to watch a given part of a source observable defined by the watchingFunction.
 * Equivalent to 'map' from RxJS operators but only emits distinct values.
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

/**
 * Use an observable to perform an action and return the action result.
 * This is equivalent to: `source.pipe(map(action))` but will only emit distinct values.
 * @param source An observable emitting payloads of type T.
 * @param action An action function taking the observables emissions and return a value of type U.
 * @returns An observable emitting the result of the action function.
 */
export function using<T, U>(source: Observable<T>, action: (value: T) => U): Observable<U> {
  return source.pipe(
    watch(action),
  );
}

/**
 * Access a property on an object or object observable using an object key or observable emitting object keys.
 * This is equivalent to: `key.pipe(map(k => value[k]))` or `value.pipe(map(val => val[key]))` but will only emit distinct values.
 * @param value An object of type T.
 * @param key A key of T (K) observable.
 * @returns An observable emitting T[K].
 */
export function access<T, K extends keyof T>(value: T | Observable<T>, key: K | Observable<K>): Observable<T[K]> {
  return combineLatest([
    coerceToObservable(key).pipe(distinctUntilChanged()),
    coerceToObservable(value).pipe(distinctUntilChanged()),
  ]).pipe(
    map(([k, val]) => val[k]),
    distinctUntilChanged(),
  );
}

export interface ConditionalOptions<T, S, F = undefined> {
  if: Observable<T>,
  then: S | Observable<S>,
  else: F | Observable<F>,
}

/**
 * A function taking a source observable and either emitting the success value or the fail value depending on whether
 * the source emits a truthy or falsy value.
 * @param source An observable of type T.
 * Alternatively this may be an object containing the three arguments as properties, using the keys `if`, `then`, and `else`.
 * @param successValue The value of type S (or observable emitting type S) to return if T is truthy.
 * @param failValue The value of type F (or observable emitting type F) to return if T is falsy.
 * @returns Returns an observable emitting either the success value of type S or the fail value of type F depending on the
 * source observable.
 */
export function conditional<T, S, F = undefined>(
  source: Observable<T>,
  successValue: S | Observable<S>,
  failValue?: F | Observable<F>,
): Observable<S | F>;
/**
 * @deprecated
 */
export function conditional<T, S, F = undefined>(options: ConditionalOptions<T, S, F>): Observable<S | F>;
export function conditional<T, S, F = undefined>(
  sourceOrOptions: Observable<T> | ConditionalOptions<T, S, F>,
  successValue?: S | Observable<S>,
  failValue?: F | Observable<F>,
): Observable<S | F> {
  const { if: source, then: thenVal, else: elseVal } = sourceOrOptions instanceof Observable ? {
    if: sourceOrOptions,
    then: successValue as S | Observable<S>,
    else: failValue,
  }: sourceOrOptions;

  return source.pipe(
    distinctUntilChanged(),
    switchMap(value => coerceToObservable(value ? thenVal : elseVal as F | Observable<F>)),
    distinctUntilChanged(),
  );
}

/**
 * A function taking an observable of type T and returning a shared observable of the same type which will be reused
 * by any subscribers.
 * This is equivalent to `source.pipe(shareReplay({ bufferSize: 1, refCount: true }))` but will only emit distinct values.
 * @param source An observable of type T.
 * @returns A multicast observable which will only be subscribed once, future subscriptions will receive the same values.
 */
export function reuse<T>(source: Observable<T>): Observable<T> {
  return source.pipe(
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

/**
 * @returns An observable emitting the logical NOT value of the source observable's emissions.
 */
 export function not(source: Observable<any>): Observable<boolean> {
  return source.pipe(
    distinctUntilChanged(),
    map(val => !val),
    distinctUntilChanged(),
  );
}

/**
 * Take a spread array of observables and emit the logical AND value of all of their emissions whenever it changes.
 */
export function and(...sources: Observable<any>[]): Observable<boolean> {
  return combineLatest(
    sources.map(source => source.pipe(distinctUntilChanged())),
  ).pipe(
    map(values => values.every(value => Boolean(value))),
    distinctUntilChanged(),
  );
}

/**
 * Take a spread array of observables and emit the logical NAND value of all of their emissions whenever it changes.
 */
export function nand(...sources: Observable<any>[]): Observable<boolean> {
  return not(and(...sources));
}

/**
 * Take a spread array of observables and emit the logical OR value of all of their emissions whenever it changes.
 */
export function or(...sources: Observable<any>[]): Observable<boolean> {
  return combineLatest(
    sources.map(source => source.pipe(distinctUntilChanged())),
  ).pipe(
    map(values => values.some(value => Boolean(value))),
    distinctUntilChanged(),
  );
}

/**
 * Take a spread array of observables and emit the logical NOR value of all of their emissions whenever it changes.
 */
export function nor(...sources: Observable<any>[]): Observable<boolean> {
  return not(or(...sources));
}

/**
 * @param sources A spread array of items or observables emitting items of type T.
 * @returns An observable emitting whether all items are equal whenever they change.
 */
export function equals<T>(...sources: (T | Observable<T>)[]): Observable<boolean> {
  return combineLatest(
    sources.map(
      source => coerceToObservable(source).pipe(distinctUntilChanged()),
    ),
  ).pipe(
    map(values => values.every(val => val === values[0])),
    distinctUntilChanged(),
  );
}

/**
 * An observable operator to console log the current value of an observable.
 * @param message A string to place before the logged value, or a function taking the value and returning a string to log.
 */
export function log<T = unknown>(message?: string | ((val: T) => string)): OperatorFunction<T, T extends never ? never : T> {
  return (input: Observable<T>): Observable<T extends never ? never : T> => input.pipe(
    tap<T extends never ? never : T>(val => {
      if (!message) console.log(val);
      else if (typeof message === 'string') console.log(message, val);
      else if (typeof message === 'function') console.log(message(val));
    }),
  );
}

/**
 * An observable operator to add a side effect observable into the stream.
 * This is similar to the built in `tap` operator in RxJS except the side effect is an observable to be injected into the stream.
 * @param effect A function taking the emission of the source observable and returning an observable of any type.
 * @returns An operator function mirroring the source observable.
 */
 export function switchTap<T, U>(
  effectObservable: (element: T) => Observable<U>,
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => source.pipe(
    distinctUntilChanged(),
    switchMap(element => effectObservable(element).pipe( // Add the effect observable into the stream.
      ignoreElements(), // Ignore the effect observable's emissions.
      startWith(element), // Return the original element as a single emission.
    )),
    distinctUntilChanged(),
  );
}
