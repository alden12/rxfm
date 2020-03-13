import { OperatorFunction, Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap, startWith, mapTo, shareReplay } from 'rxjs/operators';
import { Component, ComponentOperator } from './components';
import { extractEvent } from './events';
import { distinctUntilKeysChanged, SHARE_REPLAY_CONFIG } from '.';

export type Reducer<S> = (state: S) => Partial<S>;

export interface IAction<S> {
  action?: Reducer<S>;
}

export function dispatch<T, S>(
  actionFunction: (event: T) => Reducer<S>,
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
