import { ElementType, Component } from './component';
import { ChildComponent, ChildEvents } from '../children/children';
import { Observable, OperatorFunction } from 'rxjs';
import { ElementEventMap, EmitEvent, EventType, EventDelete } from '../events';
import { SetState } from '../state';
import { IAttributes } from '../attributes';
export declare type EventOperators<E = unknown> = {
    [K in keyof ElementEventMap]?: OperatorFunction<ElementEventMap[K], E>;
};
export declare type AttributeEvents<T extends EventOperators> = T extends EventOperators<infer E> ? E extends EmitEvent<infer ET, infer EV> ? EventType<ET, EV> : never : never;
/**
 * A function to create a component of type T.
 */
export declare type ComponentCreatorFunction<T extends ElementType, E extends EventType = never> = {
    (): Component<T, E>;
    <A extends EventOperators<unknown>>(attributes: A & IAttributes): Component<T, E | AttributeEvents<A>>;
    <C0 extends ChildComponent<ElementType, any>, C extends ChildComponent<ElementType, any>[]>(childComponent: C0, ...childComponents: C): Component<T, E | ChildEvents<[C0]> | ChildEvents<C>>;
    <A extends EventOperators<unknown>, C extends ChildComponent<ElementType, any>[]>(attributes: A & IAttributes, ...childComponents: C): Component<T, E | ChildEvents<C> | AttributeEvents<A>>;
};
export interface IComponentArgs<C extends ChildComponent[]> {
    children: C;
    attributes: IAttributes;
}
export interface IStatefulComponentArgs<C extends ChildComponent[], S> extends IComponentArgs<C> {
    state: Observable<S>;
}
export declare type ComponentFunction<T extends ElementType, E extends EventType = never> = <C extends ChildComponent[] = []>(args: IComponentArgs<C>) => Component<T, E | ChildEvents<C>>;
export declare type StatefulComponentFunction<T extends ElementType, E extends EventType = never, S = never> = <C extends ChildComponent[] = []>(args: IStatefulComponentArgs<C, S>) => Component<T, EventType<SetState, Partial<S>> | EventDelete<E, SetState> | ChildEvents<C>>;
export declare function component<T extends ElementType, E extends EventType = never>(componentFunction: ComponentFunction<T, E>): ComponentCreatorFunction<T, E>;
export declare function component<T extends ElementType, S, E extends EventType = never>(componentFunction: StatefulComponentFunction<T, E, S>, initialState: S): ComponentCreatorFunction<T, EventDelete<E, SetState>>;
