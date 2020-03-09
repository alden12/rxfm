import { Observable, BehaviorSubject, OperatorFunction } from 'rxjs';
import { Component, ComponentOperator } from './components';
import { shareReplay, tap, switchMap, mapTo, startWith, withLatestFrom, map } from 'rxjs/operators';
import { SHARE_REPLAY_CONFIG, distinctUntilKeysChanged, action } from './utils';
import { extractEvent } from './events';

// export type Action<S> = (state: S) => S;

// export type Actions<K extends string, S> = Partial<Record<K, Action<S>>>;

// export function state<T extends Node, S, K extends string, E extends Actions<K, S>>(
//   eventType: K,
//   stateSubject: BehaviorSubject<S>,
// ): ComponentOperator<T, E, { [EK in Exclude<keyof E, K>]?: E[EK] }> {
//   return (component: Component<T, E>) => component.pipe(
//     extractEvent(eventType),
//     switchMap(({ node, events, extractedEvents }) => extractedEvents.pipe(
//       tap((action: Action<S>) => stateSubject.next(action(stateSubject.value))),
//       startWith({ node, events }),
//       mapTo({ node, events }),
//     )),
//     distinctUntilKeysChanged(),
//     shareReplay(SHARE_REPLAY_CONFIG),
//   );
// }

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

// TODO: Depricate passing state in favor of in place with latest from?
export function stateAction<T, A>(mappingFunction: (event: T) => A): OperatorFunction<T, Record<'state', A>>
export function stateAction<T, A, S>(
  state: Observable<S>,
  mappingFunction: ({ ev: T, currentState: S }) => A,
): OperatorFunction<T, Record<'state', A>>

export function stateAction<T, A, S>(
  mappingFunctionOrState?: ((event: T) => A) | (({ ev: T, currentState: S }) => A) | Observable<S>,
  mappingFn?: (({ ev: T, currentState: S }) => A),
): OperatorFunction<T, Record<'state', A>> {
  if (mappingFn !== undefined) {
    const state = mappingFunctionOrState as Observable<S>;
    return (event: Observable<T>) => event.pipe(
      withLatestFrom(state),
      map(([ev, currentState]) => ({ ev, currentState })),
      action('state', mappingFn),
    );
  } else {
    const mappingFunction = mappingFunctionOrState as (event: T) => A;
    return action('state', mappingFunction);
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

// TODO: Create store
