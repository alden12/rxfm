import { Observable, OperatorFunction, of } from 'rxjs';
import { map, distinctUntilChanged, pluck, shareReplay, switchMap } from 'rxjs/operators';

export const SHARE_REPLAY_CONFIG = { bufferSize: 1, refCount: true };

export function watch<T, U>(
  wathchingFunction: (item: T) => U,
): OperatorFunction<T, U> {
  return (input: Observable<T>) => input.pipe(
    map(wathchingFunction),
    distinctUntilChanged(),
    shareReplay(SHARE_REPLAY_CONFIG),
  );
}

export function select<T, K extends keyof T>(
  key: K,
): OperatorFunction<T, T[K]> {
  return (input: Observable<T>) => input.pipe(
    pluck(key),
    distinctUntilChanged(),
    shareReplay(SHARE_REPLAY_CONFIG),
  );
}

export function distinctUntilKeysChanged<T>(): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) => source.pipe(
    distinctUntilChanged((prev, curr) => !Object.keys(prev).some(key => curr[key] !== prev[key])),
  )
}

export function gate<T>(source: Observable<T>): OperatorFunction<boolean, T | undefined> {
  return (gate$: Observable<boolean>) => gate$.pipe(
    distinctUntilChanged(),
    switchMap(gatePosition => gatePosition ? source : of(undefined)),
  );
}
