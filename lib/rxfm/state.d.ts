import { ElementType, Component } from './components';
import { Observable, OperatorFunction } from 'rxjs';
import { EmitEvent, EventDelete, EventType } from './events';
export declare const SET_STATE: "rxfmSetState";
export declare type SetState = typeof SET_STATE;
export declare function stateful<T extends ElementType, S, E extends EventType>(initialState: S, creationFunction: (state: Observable<S>) => Component<T, EventType<SetState, Partial<S>> | EventDelete<E, SetState>>): Component<T, EventDelete<E, SetState>>;
export declare function setState<T, S>(mappingFunction: (event: T) => S): OperatorFunction<T, EmitEvent<SetState, S>>;
export declare function setState<T, S, ST>(state: Observable<ST>, mappingFunction: (currentState: ST, event: T) => S): OperatorFunction<T, EmitEvent<SetState, S>>;
export declare function setState<T, S, STA, STB>(stateA: Observable<STA>, stateB: Observable<STB>, mappingFunction: (stateA: STA, stateB: STB, event: T) => S): OperatorFunction<T, EmitEvent<SetState, S>>;
