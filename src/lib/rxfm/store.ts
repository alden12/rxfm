import { OperatorFunction, Observable, BehaviorSubject, throwError } from 'rxjs';
import { EmitEvent, emitEvent, event, EventType, EventDelete } from './events';
import { withLatestFrom, tap, shareReplay } from 'rxjs/operators';
import { ComponentOperator, ElementType, Component } from './components';
import { watch, REF_COUNT } from './utils';

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

export const DISPATCH = 'rxfmDispatch' as const;
export type Dispatch = typeof DISPATCH;

// /**
//  * An observable operator to dispatch an 'action' to the store (see the 'store' operator). These actions should be of
//  * type 'Action'. Actions functions (of type Action) take a payload and return a reducer function (of type
//  * Reducer). The reducer function takes the current state (of type S) and returns a new state for the store. Reducer
//  * functions should be immutable (meaning that the state should not be modified and should instead be cloned) and pure
//  * (meaning that they should have no side effects and should only operate based on their input).
//  * @param actionFunction A function taking an event payload (of type T) and returning a Reducer function.
//  */
export function dispatch<T, S>(
  action: Action<T, S>,
): OperatorFunction<T, EmitEvent<Dispatch, Reducer<S>>>
export function dispatch<T, S, ST>(
  state: Observable<ST>,
  action: (currentState: ST, event: T) => Reducer<S>,
): OperatorFunction<T, EmitEvent<Dispatch, Reducer<S>>>
export function dispatch<T, S, STA, STB>(
  stateA: Observable<STA>,
  stateB: Observable<STB>,
  action: (stateA: STA, stateB: STB, event: T) => Reducer<S>,
): OperatorFunction<T, EmitEvent<Dispatch, Reducer<S>>>
export function dispatch<T, S, STA, STB>(
  stateAOrAction: Observable<STA> | Action<T, S>,
  stateBOrAction?: Observable<STB> | ((currentState: STA, event: T) => Reducer<S>),
  _action?: (stateA: STA, stateB: STB, event: T) => Reducer<S>,
): OperatorFunction<T, EmitEvent<Dispatch, Reducer<S>>> {

  if (_action) {
    return (event$: Observable<T>) => event$.pipe(
      withLatestFrom(stateAOrAction as Observable<STA>, stateBOrAction as Observable<STB>),
      emitEvent(DISPATCH, ([ev, latestFromA, latestFromB]) => _action(latestFromA, latestFromB, ev))
    );
  } else if (typeof stateBOrAction === 'function') {
    return (event$: Observable<T>) => event$.pipe(
      withLatestFrom(stateAOrAction as Observable<STA>),
      emitEvent(DISPATCH, ([ev, latestFromA]) => stateBOrAction(latestFromA, ev))
    );
  }
  return (event$: Observable<T>) => event$.pipe(
    emitEvent(DISPATCH, stateAOrAction as Action<T, S>)
  );
}

/**
 * An observable operator to manage a 'store' of global state. Similar to Redux.
 * Extracts any 'action' events which should be functions taking the current state and returning the new state for the
 * store. These actions should be created from the 'dispatch' operator. Action functions (reducers) are then executed
 * and the new state is emitted by the state subject. This subject can be mapped and used as input for components.
 * @param storeSubject A behavior subject ot be used as the store.
 */
export function connect<T extends ElementType, S, E extends EventType>(
  storeSubject: BehaviorSubject<S>,
): ComponentOperator<T, EventType<Dispatch, Reducer<S>> | EventDelete<E, Dispatch>, EventDelete<E, Dispatch>> {
  return (component$: Component<T, E>) => component$.pipe(
    event(
      DISPATCH,
      tap(ev => storeSubject.next({ ...storeSubject.value, ...(ev as CustomEvent<Reducer<S>>).detail(storeSubject.value) })),
    )
  );
}

export function selector<S, T>(storeObservable: Observable<S>, selectorFunction: (state: S) => T): Observable<T> {
  return storeObservable.pipe(
    watch(selectorFunction),
    shareReplay(REF_COUNT),
  );
}

export function action<T, S>(
  reducer: (state: S, payload: T) => Partial<S>
): Action<T, S> {
  return (payload: T) => (state: S) => reducer(state, payload);
}

export class Store<S> {

  private storeSubject: BehaviorSubject<S>;
  private isConnected = false;

  constructor(initialState: S) {
    this.storeSubject = new BehaviorSubject<S>(initialState);
  }

  public connect<T extends ElementType, E extends EventType = never>(
    component: Component<T, EventType<Dispatch, Reducer<S>> | EventDelete<E, Dispatch>>,
  ): Component<T, EventDelete<E, Dispatch>> {
    if (this.isConnected) {
      return throwError('RxFM Error: Store already connected, store may only be connected once.')
    }
    this.isConnected = true;
    return component.pipe(
      connect(this.storeSubject),
    );
  }

  public select<T>(selectorFunction: (state: S) => T): Observable<T> {
    return selector(this.storeSubject, selectorFunction);
  }

  public action<T>(
    reducer: (state: S, payload: T) => Partial<S>
  ): Action<T, S>
  public action<T, R extends keyof S>(
    root: R,
    reducer: (state: S[R], payload: T) => Partial<S[R]>
  ): Action<T, S>
  public action<T, R extends keyof S>(
    reducerOrRoot: ((state: S, payload: T) => Partial<S>) | R,
    reducer?: (state: S[R], payload: T) => Partial<S[R]>
  ): Action<T, S> {
    if (reducer) {
      const key = reducerOrRoot as R;
      const _reducer = (state: S, payload: T) => {
        const newState = { ...state };
        newState[key] = { ...state[key], ...reducer(state[key], payload) };
        return newState;
      };
      return action(_reducer);
    }
    return action(reducerOrRoot as (state: S, payload: T) => Partial<S>);
  }
}
