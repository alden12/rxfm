import { Observable } from "rxjs";
import { distinctUntilChanged, shareReplay, switchMap } from "rxjs/operators";
import { coerceToObservable, selectFrom, watchFrom } from "./utils";

export type DestructuredObservable<T> = {
  [K in keyof T]: Observable<T[K]>;
};

/**
 * Destructure properties from the source observable in a similar way to destructuring an object in normal JavaScript code.
 * @param source An observable emitting an object of type T.
 * @returns An object where keys are observables emitting the corresponding property from the source observables object emissions.
 */
export function destructure<T> (source: Observable<T>): DestructuredObservable<T> {
  const handler = {
    get: (_: DestructuredObservable<T>, prop: string | symbol) => selectFrom(source, prop as keyof T),
  };
  return new Proxy({} as DestructuredObservable<T>, handler);
}

/**
 * Use an observable to perform an action and return the action result.
 * This is equivalent to: `source.pipe(map(action))`.
 * @param source An observable emitting payloads of type T.
 * @param action An action function taking the observables emissions and return a value of type U.
 * @returns An observable emitting the result of the action function.
 */
export function using<T, U>(source: Observable<T>, action: (value: T) => U): Observable<U> {
  return watchFrom(source, action);
}

/**
 * A function taking a source observable and either emitting the success value or the fail value depending on whether
 * the source emits a truthy or falsy value.
 * @param source An observable of type T.
 * @param successValue The value of type S (or observable emitting type S) to return if T is truthy.
 * @param failValue The value of type F (or observable emitting type F) to return if T is falsy.
 * @returns Returns an observable emitting either the success value of type S or the fail value of type F depending on the
 * source observable.
 */
export function conditional<T, S, F = undefined>(
  source: Observable<T>,
  successValue: S | Observable<S>,
  failValue?: F | Observable<F>,
): Observable<S | F> {
  return source.pipe(
    distinctUntilChanged(),
    switchMap(value => Boolean(value) ? coerceToObservable(successValue) : coerceToObservable(failValue as F)),
    distinctUntilChanged(),
  );
}

/**
 * A function taking an observable of type T and returning a shared observable of the same type which will be reused
 * by any subscribers.
 * This is equivalent to `source.pipe(shareReplay({ bufferSize: 1, refCount: true }))`.
 * @param source An observable of type T.
 * @returns A multicast observable which will only be subscribed once, future subscriptions will receive the same values.
 */
export function reuse<T>(source: Observable<T>): Observable<T> {
  return source.pipe(
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
