import { OperatorFunction, Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap, startWith, mapTo, shareReplay, withLatestFrom } from 'rxjs/operators';
import { Component, ComponentOperator } from './components';
import { extractEvent } from './events';
import { distinctUntilKeysChanged, SHARE_REPLAY_CONFIG } from '.';

export type Reducer<S> = (state: S) => Partial<S>;

export type Action<T, S> = (payload: T) => Reducer<S>;

export interface IAction<S> {
  action?: Reducer<S>;
}

export function dispatch<T, S>(
  actionFunction: Action<T, S>, // Can this be made to also take a reducer function directly?
): OperatorFunction<T, Record<'action', Reducer<S>>> {
  return (event: Observable<T>) => event.pipe(
    map(ev => ({ action: actionFunction(ev) })),
  );
}

export function store<T extends Node, S, E extends IAction<S>>(
  stateSubject: BehaviorSubject<S>,
): ComponentOperator<T, E, { [EK in Exclude<keyof E, 'action'>]?: E[EK] }> {
  return (component: Component<T, E>) => component.pipe(
    extractEvent('action'),
    switchMap(({ node, events, extractedEvents }) => extractedEvents.pipe(
      tap(reducer => stateSubject.next({ ...stateSubject.value, ...reducer(stateSubject.value) })),
      startWith({ node, events }),
      mapTo({ node, events }),
    )),
    distinctUntilKeysChanged(),
    shareReplay(SHARE_REPLAY_CONFIG),
  );
}
