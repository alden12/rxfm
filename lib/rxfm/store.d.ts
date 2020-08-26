import { OperatorFunction, Observable, BehaviorSubject } from 'rxjs';
import { EmitEvent, EventType, EventDelete } from './events';
import { ComponentOperator, ElementType, Component } from './components';
/**
 * A function taking the current state of an information store (of type S) and returning a new state for the store.
 * Reducer functions should be immutable (meaning that the state should not be modified and should instead be cloned)
 * and pure (meaning that they should have no side effects and should only operate based on their input).
 */
export declare type Reducer<S> = (state: S) => Partial<S>;
/**
 * A function taking a payload event (of type T) and return a Reducer function of type S.
 */
export declare type Action<T, S> = (payload: T) => Reducer<S>;
/**
 * A record used to emit a reducer action to the store.
 */
export interface IAction<S> {
    action?: Reducer<S>;
}
export declare const DISPATCH: "rxfmDispatch";
export declare type Dispatch = typeof DISPATCH;
export declare function dispatch<T, S>(action: Action<T, S>): OperatorFunction<T, EmitEvent<Dispatch, Reducer<S>>>;
export declare function dispatch<T, S, ST>(state: Observable<ST>, action: (currentState: ST, event: T) => Reducer<S>): OperatorFunction<T, EmitEvent<Dispatch, Reducer<S>>>;
export declare function dispatch<T, S, STA, STB>(stateA: Observable<STA>, stateB: Observable<STB>, action: (stateA: STA, stateB: STB, event: T) => Reducer<S>): OperatorFunction<T, EmitEvent<Dispatch, Reducer<S>>>;
/**
 * An observable operator to manage a 'store' of global state. Similar to Redux.
 * Extracts any 'action' events which should be functions taking the current state and returning the new state for the
 * store. These actions should be created from the 'dispatch' operator. Action functions (reducers) are then executed
 * and the new state is emitted by the state subject. This subject can be mapped and used as input for components.
 * @param storeSubject A behavior subject ot be used as the store.
 */
export declare function connect<T extends ElementType, S, E extends EventType>(storeSubject: BehaviorSubject<S>): ComponentOperator<T, EventType<Dispatch, Reducer<S>> | EventDelete<E, Dispatch>, EventDelete<E, Dispatch>>;
export declare function selector<S, T>(storeObservable: Observable<S>, selectorFunction: (state: S) => T): Observable<T>;
export declare function action<T, S>(reducer: (state: S, payload: T) => Partial<S>): Action<T, S>;
export declare class Store<S> {
    private storeSubject;
    private isConnected;
    constructor(initialState: S);
    connect<T extends ElementType, E extends EventType = never>(component: Component<T, EventType<Dispatch, Reducer<S>> | EventDelete<E, Dispatch>>): Component<T, EventDelete<E, Dispatch>>;
    select<T>(selectorFunction: (state: S) => T): Observable<T>;
    action<T>(reducer: (state: S, payload: T) => Partial<S>): Action<T, S>;
    action<T, R extends keyof S>(root: R, reducer: (state: S[R], payload: T) => Partial<S[R]>): Action<T, S>;
}
