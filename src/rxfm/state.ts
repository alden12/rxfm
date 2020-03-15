import { Observable, BehaviorSubject, OperatorFunction } from 'rxjs';
import { Component } from './components';
import { shareReplay, tap, switchMap, mapTo, startWith, map } from 'rxjs/operators';
import { SHARE_REPLAY_CONFIG, distinctUntilKeysChanged } from './utils';
import { extractEvent } from './events';

// Is this generic function needed?
export function stateLoop<T extends Node, S, E, K extends keyof E>(
  initialState: S,
  creationFunction: (state: Observable<S>) => Component<T, E>,
  eventType: K,
  stateFunction: (event: E[K], currentState: Readonly<S>) => S,
): Component<T, { [EK in Exclude<keyof E, K>]?: E[EK] }> {

  const stateSubject = new BehaviorSubject<S>(initialState);

  return creationFunction(stateSubject.asObservable()).pipe(
    extractEvent(eventType),
    switchMap(({ node, events, extractedEvents }) => extractedEvents.pipe(
      tap(ev => stateSubject.next(stateFunction(ev, stateSubject.value))),
      startWith({ node, events }),
      mapTo({ node, events }),
    )),
    distinctUntilKeysChanged(),
    shareReplay(SHARE_REPLAY_CONFIG),
  );
}

export interface IStateAction<T> {
  state?: Partial<T>;
}

export function setState<T, A>(
  mappingFunction: (event: T) => A,
): OperatorFunction<T, Record<'state', A>> {
  return (event$: Observable<T>) => event$.pipe(
    map(event => ({ state: mappingFunction(event) })),
  )
}

export function stateful<T extends Node, S, E extends IStateAction<S>>(
  initialState: Partial<S> = {},
  creationFunction: (state: Observable<Partial<S>>) => Component<T, E>,
): Component<T, { [EK in Exclude<keyof E, 'state'>]?: E[EK] }> {
  return stateLoop(
    initialState,
    creationFunction,
    'state',
    (event, currentState) => ({ ...currentState, ...event }),
  );
}
