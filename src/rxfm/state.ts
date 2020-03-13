import { Observable, BehaviorSubject, OperatorFunction } from 'rxjs';
import { Component, ComponentOperator } from './components';
import { shareReplay, tap, switchMap, mapTo, startWith, withLatestFrom, map } from 'rxjs/operators';
import { SHARE_REPLAY_CONFIG, distinctUntilKeysChanged } from './utils';
import { extractEvent } from './events';

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
): OperatorFunction<T, Record<'state', A>>

export function setState<T, A, S>(
  state: Observable<S>,
  mappingFunction: ({ event: T, state: S }) => A,
): OperatorFunction<T, Record<'state', A>>

export function setState<T, A, S>(
  mappingFunctionOrState?: ((event: T) => A) | Observable<S>,
  mappingFn?: (({ event: T, state: S }) => A),
): OperatorFunction<T, Record<'state', A>> {
  if (mappingFn !== undefined) {
    const state$ = mappingFunctionOrState as Observable<S>;
    return (event$: Observable<T>) => event$.pipe(
      withLatestFrom(state$),
      map(([event, state]) => ({ state: mappingFn({ event, state }) }))
    );
  } else {
    return (event$: Observable<T>) => event$.pipe(
      map(event => ({ state: (mappingFunctionOrState as (event: T) => A)(event) })),
    )
  }
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
