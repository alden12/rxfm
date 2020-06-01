// import { Observable, BehaviorSubject, OperatorFunction } from 'rxjs';
// import { ComponentOld } from './components';
// import { shareReplay, tap, switchMap, mapTo, startWith, map } from 'rxjs/operators';
// import { SHARE_REPLAY_CONFIG, distinctUntilKeysChanged } from './utils';
// import { extractEvent } from './events';

import { ElementType, ComponentObservable, EventType } from './components';
import { Observable, BehaviorSubject, OperatorFunction, of } from 'rxjs';
import { EventDelete } from './utils';
import { event, EmitEvent, emitEvent } from './events';
import { tap, map, switchMap, withLatestFrom } from 'rxjs/operators';

export const SET_STATE = 'rxfmSetState' as const;
export type SetState = typeof SET_STATE;

export function stateful<T extends ElementType, S, E extends EventType<SetState, Partial<S>>>(
    initialState: S,
    creationFunction: (state: Observable<S>) => ComponentObservable<T, E>,
): ComponentObservable<T, EventDelete<E, SetState>> {

  return of(creationFunction).pipe(
    map(creationFn => {
      const stateSubject = new BehaviorSubject<S>({ ...initialState });
      const component = creationFn(stateSubject);
      return [component, stateSubject] as const;
    }),
    switchMap(([component, stateSubject]) => component.pipe(
      event(
        SET_STATE,
        tap(ev => stateSubject.next({ ...stateSubject.value, ...(ev as CustomEvent<Partial<S>>).detail })),
      )
    )),
  );
}

export function setState<T, S>(
  mappingFunction: (event: T) => S,
): OperatorFunction<T, EmitEvent<SetState, S>>
export function setState<T, S, ST>(
  state: Observable<ST>,
  mappingFunction: (currentState: ST, event: T) => S,
): OperatorFunction<T, EmitEvent<SetState, S>>
export function setState<T, S, ST>(
  stateOrMappingFn: Observable<ST> | ((event: T) => S),
  mappingFn?: (state: ST, event: T) => S,
): OperatorFunction<T, EmitEvent<SetState, Partial<S>>> {

  if (mappingFn) {
    return (event$: Observable<T>) => event$.pipe(
      withLatestFrom(stateOrMappingFn as Observable<ST>),
      emitEvent(SET_STATE, ([ev, latestFrom]) => mappingFn(latestFrom, ev))
    );
  }

  return (event$: Observable<T>) => event$.pipe(
    emitEvent(SET_STATE, stateOrMappingFn as (event: T) => S)
  );
}

////

// // Is this generic function needed?
// /**
//  * A wrapper function to give state to an RxFM component by looping state emissions from the component back into the
//  * component input.
//  * @param initialState The initial state for the component.
//  * @param creationFunction A function taking the initial state and returning an RxFM component observable.
//  * @param eventType The string type used to identify events to update the state.
//  * @param stateFunction A function taking an event and the current state and return the new state.
//  * @typeParam S The state type.
//  * @typeParam E The component events type.
//  * @typeParam E The string event type identifying a state update event.
//  */
// export function stateLoop<T extends Node, S, E, K extends keyof E>(
//   initialState: S,
//   creationFunction: (state: Observable<S>) => ComponentOld<T, E>,
//   eventType: K,
//   stateFunction: (event: E[K], currentState: Readonly<S>) => S,
// ): ComponentOld<T, { [EK in Exclude<keyof E, K>]?: E[EK] }> {

//   const stateSubject = new BehaviorSubject<S>(initialState);

//   return creationFunction(stateSubject.asObservable()).pipe(
//     extractEvent(eventType),
//     switchMap(({ node, events, extractedEvents }) => extractedEvents.pipe(
//       tap(ev => stateSubject.next(stateFunction(ev, stateSubject.value))),
//       startWith({ node, events }),
//       mapTo({ node, events }),
//     )),
//     distinctUntilKeysChanged(),
//     shareReplay(SHARE_REPLAY_CONFIG),
//   );
// }

// export interface IStateAction<T> {
//   state?: Partial<T>;
// }

// /**
//  * An observable operator to update the state of an RxFM component wrapped by the 'stateful' function. This operator
//  * should be called within the 'event' operator to emit a state update request triggered by an event. This may be
//  * called by children or nested children of the wrapped component. The 'stateful' function will capture the 'state'
//  * events and prevent further propagation.
//  * @param mappingFunction A function to map an event of type T, to a partial state object. This should be of the same
//  * type as the state used in the 'stateful' function wrapping the component.
//  */
// export function setState<T, A>(
//   mappingFunction: (event: T) => A,
// ): OperatorFunction<T, Record<'state', A>> {
//   return (event$: Observable<T>) => event$.pipe(
//     map(event => ({ state: mappingFunction(event) })),
//   )
// }

// /**
//  * A function to give local state (of type S) to an RxFM component. Use the 'setState' operator to update the state from
//  * within the wrapped component.
//  * @param initialState The initial state for the component.
//  * @param creationFunction A function taking an observable emitting the state (S) and returning an RxFM component
//  * observable.
//  * @returns An RxFM component observable.
//  */
// export function stateful<T extends Node, S, E extends IStateAction<S>>(
//   initialState: Partial<S> = {},
//   creationFunction: (state: Observable<Partial<S>>) => ComponentOld<T, E>,
// ): ComponentOld<T, { [EK in Exclude<keyof E, 'state'>]?: E[EK] }> {
//   return stateLoop(
//     initialState,
//     creationFunction,
//     'state',
//     (event, currentState) => ({ ...currentState, ...event }),
//   );
// }
