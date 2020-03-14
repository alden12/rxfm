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
  actionFunction: Action<T, S>,
): OperatorFunction<T, Record<'action', Reducer<S>>>

export function dispatch<T, S, L>(
  latestFrom: Observable<L>,
  actionFunction: Action<{ event: T, state: L }, S>,
): OperatorFunction<T, Record<'action', Reducer<S>>>

export function dispatch<T, S, L>(
  latestFromOrActionFunction: Observable<L> | Action<T, S>,
  actionFunction?: Action<{ event: T, state: L }, S>,
): OperatorFunction<T, Record<'action', Reducer<S>>> {
  if (actionFunction !== undefined) {
    return (event: Observable<T>) => event.pipe(
      withLatestFrom(latestFromOrActionFunction as Observable<L>),
      map(([ev, state]) => ({ action: actionFunction({ event: ev, state }) }))
    );
  } else {
    return (event: Observable<T>) => event.pipe(
      map(ev => ({ action: (latestFromOrActionFunction as Action<T, S>)(ev) })),
    );
  }
}

//   return (event: Observable<T>) => event.pipe(
//     map(ev => ({ action: actionFunction(ev) })),
//   );
// }

// export function setState<T, A>(
//   mappingFunction: (event: T) => A,
// ): OperatorFunction<T, Record<'state', A>>

// export function setState<T, A, S>(
//   state: Observable<S>,
//   mappingFunction: ({ event: T, state: S }) => A,
// ): OperatorFunction<T, Record<'state', A>>

// export function setState<T, A, S>(
//   mappingFunctionOrState?: ((event: T) => A) | Observable<S>,
//   mappingFn?: (({ event: T, state: S }) => A),
// ): OperatorFunction<T, Record<'state', A>> {
//   if (mappingFn !== undefined) {
//     const state$ = mappingFunctionOrState as Observable<S>;
//     return (event$: Observable<T>) => event$.pipe(
//       withLatestFrom(state$),
//       map(([event, state]) => ({ state: mappingFn({ event, state }) }))
//     );
//   } else {
//     return (event$: Observable<T>) => event$.pipe(
//       map(event => ({ state: (mappingFunctionOrState as (event: T) => A)(event) })),
//     )
//   }
// }

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
