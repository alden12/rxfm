import { Observable, OperatorFunction } from 'rxjs';
import { map, distinctUntilChanged, pluck } from 'rxjs/operators';

export const SHARE_REPLAY_CONFIG = { bufferSize: 1, refCount: true };

export function watch<T, U>(
  wathchingFunction: (item: T) => U,
): (input: Observable<T>) => Observable<U> {
  return (input: Observable<T>) => input.pipe(
    map(wathchingFunction),
    distinctUntilChanged(),
  );
}

export function select<T, K extends keyof T>(
  key: K,
): (input: Observable<T>) => Observable<T[K]> {
  return (input: Observable<T>) => input.pipe(
    pluck(key),
    distinctUntilChanged(),
  );
}

export function distinctUntilKeysChanged<T>(): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) => source.pipe(
    distinctUntilChanged((prev, curr) => !Object.keys(prev).some(key => curr[key] !== prev[key])),
  )
}
