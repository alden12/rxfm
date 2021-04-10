import { Observable } from "rxjs";
import { distinctUntilChanged, map, shareReplay } from "rxjs/operators";
import { selectFrom, watchFrom } from "./utils";

export type DestructuredObservable<T> = {
  [K in keyof T]: Observable<T[K]>;
};

export function destructure<T> (source: Observable<T>): DestructuredObservable<T> {
  const handler = {
    get: (_: DestructuredObservable<T>, prop: string | symbol) => selectFrom(source, prop as keyof T),
  };
  return new Proxy({} as DestructuredObservable<T>, handler);
}

export function using<T, U>(source: Observable<T>, action: (value: T) => U): Observable<U> {
  return watchFrom(source, action);
}

export function conditional<T, S, F = undefined>(source: Observable<T>, successValue: S, failValue?: F): Observable<S | F> {
  return source.pipe(
    distinctUntilChanged(),
    map(value => Boolean(value) ? successValue as S : failValue as F),
    distinctUntilChanged(),
  );
}

export function reuse<T>(source: Observable<T>): Observable<T> {
  return source.pipe(
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
