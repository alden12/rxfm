import { Observable, BehaviorSubject, of } from 'rxjs';
import { Component } from './component';
import { switchAll, shareReplay, tap, map, switchMap } from 'rxjs/operators';
import { SHARE_REPLAY_CONFIG } from './utils';
import { extractEvent } from './events';

export function stateLoop<T extends Node, E, K extends keyof E, S>(
  initialState: S,
  creationFunction: (state: Observable<S>, currentState: () => Readonly<S>) => Component<T, E>,
  eventType: K,
  stateFunction: (event: E[K], currentState: Readonly<S>) => S,
): Component<T, { [EK in Exclude<keyof E, K>]?: E[EK] }> {

  const stateSubject = new BehaviorSubject<Observable<S>>(of(initialState));
  let currentState: S = initialState;
  const state = stateSubject.pipe(
    switchAll(),
    tap(st => currentState = st),
    shareReplay(SHARE_REPLAY_CONFIG),
  )

  const component = creationFunction(state, () => currentState).pipe(
    extractEvent(eventType),
    shareReplay(SHARE_REPLAY_CONFIG),
  );
  const stateUpdates = component.pipe(
    switchMap(({ extractedEvents }) => extractedEvents),
    map(event => stateFunction(event, currentState)),
  );

  stateSubject.next(stateUpdates);
  return component.pipe(
    map(({ node, events }) => ({ node, events })),
  );
}

export interface IStateAction<T> {
  state?: Partial<T>;
}

export function stateManager<T extends Node, S, E extends IStateAction<S>>(
  initialState: Partial<S> = {},
  creationFunction: (state: Observable<Partial<S>>, currentState: () => Readonly<Partial<S>>) => Component<T, E>,
): Component<T, { [EK in Exclude<keyof E, 'state'>]?: E[EK] }> {
  return stateLoop(
    initialState,
    creationFunction,
    'state',
    (event, currentState) => ({ ...currentState, ...event }),
  );
}
