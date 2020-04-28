import { OperatorFunction, Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap, startWith, mapTo, shareReplay } from 'rxjs/operators';
import { Component, ComponentOperator } from './components';
import { extractEvent } from './events';
import { distinctUntilKeysChanged, SHARE_REPLAY_CONFIG } from './utils';

/**
 * A function taking the current state of an information store (of type S) and returning a new state for the store.
 * Reducer functions should be immutable (meaning that the state should not be modified and should instead be cloned)
 * and pure (meaning that they should have no side effects and should only operate based on their input).
 */
export type Reducer<S> = (state: S) => Partial<S>;

/**
 * A function taking a payload event (of type T) and return a Reducer function of type S.
 */
export type Action<T, S> = (payload: T) => Reducer<S>;

/**
 * A record used to emit a reducer action to the store.
 */
export interface IAction<S> {
  action?: Reducer<S>;
}

/**
 * An observable operator to dispatch an 'action' to the store (see the 'store' operator). These actions should be of
 * type 'Action'. Actions functions (of type Action) take a payload and return a reducer function (of type
 * Reducer). The reducer function takes the current state (of type S) and returns a new state for the store. Reducer
 * functions should be immutable (meaning that the state should not be modified and should instead be cloned) and pure
 * (meaning that they should have no side effects and should only operate based on their input).
 * @param actionFunction A function taking an event payload (of type T) and returning a Reducer function.
 */
export function dispatch<T, S>(
  actionFunction: Action<T, S>, // Can this be made to also take a reducer function directly?
): OperatorFunction<T, Record<'action', Reducer<S>>> {
  return (event: Observable<T>) => event.pipe(
    map(ev => ({ action: actionFunction(ev) })), // Execute the action and map to the reducer function.
  );
}

/**
 * An observable operator to manage a 'store' of global state. Similar to Redux.
 * Extracts any 'action' events which should be functions taking the current state and returning the new state for the
 * store. These actions should be created from the 'dispatch' operator. Action functions (reducers) are then executed
 * and the new state is emitted by the state subject. This subject can be mapped and used as input for components.
 * @param stateSubject A behavior subject ot be used as the store.
 */
export function store<T extends Node, S, E extends IAction<S>>(
  stateSubject: BehaviorSubject<S>,
): ComponentOperator<T, E, { [EK in Exclude<keyof E, 'action'>]?: E[EK] }> {
  return (component: Component<T, E>) => component.pipe(
    extractEvent('action'), // Extract action events.
    // Execute the actions reducer and emit the new state.
    switchMap(({ node, events, extractedEvents }) => extractedEvents.pipe(
      tap(reducer => stateSubject.next({ ...stateSubject.value, ...reducer(stateSubject.value) })),
      startWith({ node, events }),
      mapTo({ node, events }),
    )),
    distinctUntilKeysChanged(),
    shareReplay(SHARE_REPLAY_CONFIG),
  );
}
