import { ElementType, ComponentObservable } from './components';
import { Observable, BehaviorSubject, OperatorFunction, of } from 'rxjs';
import { event, EmitEvent, emitEvent, EventDelete, EventType } from './events';
import { tap, map, switchMap, withLatestFrom } from 'rxjs/operators';

export const SET_STATE = 'rxfmSetState' as const;
export type SetState = typeof SET_STATE;

// /**
//  * A function to give local state (of type S) to an RxFM component. Use the 'setState' operator to update the state from
//  * within the wrapped component.
//  * @param initialState The initial state for the component.
//  * @param creationFunction A function taking an observable emitting the state (S) and returning an RxFM component
//  * observable.
//  * @returns An RxFM component observable.
//  */
export function stateful<T extends ElementType, S, E extends EventType>(
    initialState: S,
    creationFunction: (state: Observable<S>) =>
      ComponentObservable<T, EventType<SetState, Partial<S>> | EventDelete<E, SetState>>,
): ComponentObservable<T, EventDelete<E, SetState>> {

  return of(creationFunction).pipe(
    map(creationFn => {
      const stateSubject = new BehaviorSubject<S>({ ...initialState });
      const component = creationFn(stateSubject.asObservable());
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

// /**
//  * An observable operator to update the state of an RxFM component wrapped by the 'stateful' function. This operator
//  * should be called within the 'event' operator to emit a state update request triggered by an event. This may be
//  * called by children or nested children of the wrapped component. The 'stateful' function will capture the 'state'
//  * events and prevent further propagation.
//  * @param mappingFunction A function to map an event of type T, to a partial state object. This should be of the same
//  * type as the state used in the 'stateful' function wrapping the component.
//  */
export function setState<T, S>(
  mappingFunction: (event: T) => S,
): OperatorFunction<T, EmitEvent<SetState, S>>
export function setState<T, S, ST>(
  state: Observable<ST>,
  mappingFunction: (currentState: ST, event: T) => S,
): OperatorFunction<T, EmitEvent<SetState, S>>
export function setState<T, S, STA, STB>(
  stateA: Observable<STA>,
  stateB: Observable<STB>,
  mappingFunction: (stateA: STA, stateB: STB, event: T) => S,
): OperatorFunction<T, EmitEvent<SetState, S>>
export function setState<T, S, STA, STB>(
  stateAOrMappingFn: Observable<STA> | ((event: T) => S),
  stateBOrMappingFn?: Observable<STB> | ((currentState: STA, event: T) => S),
  mappingFn?: (stateA: STA, stateB: STB, event: T) => S,
): OperatorFunction<T, EmitEvent<SetState, Partial<S>>> {

  if (mappingFn) {
    return (event$: Observable<T>) => event$.pipe(
      withLatestFrom(stateAOrMappingFn as Observable<STA>, stateBOrMappingFn as Observable<STB>),
      emitEvent(SET_STATE, ([ev, latestFromA, latestFromB]) => mappingFn(latestFromA, latestFromB, ev))
    );
  } else if (typeof stateBOrMappingFn === 'function') {
    return (event$: Observable<T>) => event$.pipe(
      withLatestFrom(stateAOrMappingFn as Observable<STA>),
      emitEvent(SET_STATE, ([ev, latestFromA]) => stateBOrMappingFn(latestFromA, ev))
    );
  }
  return (event$: Observable<T>) => event$.pipe(
    emitEvent(SET_STATE, stateAOrMappingFn as (event: T) => S)
  );
}
