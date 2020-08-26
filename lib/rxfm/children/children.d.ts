import { Observable } from 'rxjs';
import { ElementType, RxFMElement, ComponentOperator } from '../components';
import { EventType } from '../events';
import { StringLike, NullLike } from '../utils';
/**
 * The possible types which can be added as a child component through the 'children' operator.
 */
export declare type ComponentLike<T extends ElementType, E extends EventType = never> = RxFMElement<T, E> | RxFMElement<T, E>[];
export declare type ChildComponent<T extends ElementType = ElementType, E extends EventType = EventType> = StringLike | NullLike | Observable<StringLike | NullLike | ComponentLike<T, E>>;
export declare type CoercedChildComponent = (ElementType | Text)[];
export declare type ArrayType<T extends any[]> = T extends (infer A)[] ? A extends EventType ? A : never : never;
export declare type ChildEvents<T extends ChildComponent<ElementType, EventType>[]> = ArrayType<{
    [P in keyof T]: T[P] extends Observable<ComponentLike<infer _, infer E>> ? E : never;
}>;
export declare function children<T extends ElementType, C extends ChildComponent<ElementType, EventType>[], E extends EventType = never>(...childComponents: C): ComponentOperator<T, E, E | ChildEvents<C>>;
