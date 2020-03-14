import { Observable, OperatorFunction, of } from 'rxjs';
import { map, distinctUntilChanged, pluck, shareReplay, switchMap } from 'rxjs/operators';

export const SHARE_REPLAY_CONFIG = { bufferSize: 1, refCount: true };

export function watch<T, U>(
  wathchingFunction: (item: T) => U,
): OperatorFunction<T, U> {
  return (input: Observable<T>) => input.pipe(
    map(wathchingFunction),
    distinctUntilChanged(),
  );
}

export function select<T, K extends keyof T>(
  key: K,
): OperatorFunction<T, T[K]> {
  return (input: Observable<T>) => input.pipe(
    pluck(key),
    distinctUntilChanged(),
  );
}

export function distinctUntilKeysChanged<T>(): OperatorFunction<T, T> {
  return (source: Observable<T>) => source.pipe( // TODO: Also emit if prev and curr keys lengths have changed?
    distinctUntilChanged((prev, curr) => !Object.keys(prev).some(key => curr[key] !== prev[key])),
  )
}

export function gate<T>(source: Observable<T>): OperatorFunction<boolean, T | undefined> {
  return (gate$: Observable<boolean>) => gate$.pipe(
    distinctUntilChanged(),
    switchMap(gatePosition => gatePosition ? source : of(undefined)),
  );
}
