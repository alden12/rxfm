import { Observable, OperatorFunction } from 'rxjs';
import { EventKeys, EventValue, EventDelete, EmitEvent, ElementEventMap, EventType } from '../events';
export declare type ElementType = HTMLElement | SVGElement;
export interface ICapture<T extends ElementType, E extends EventType, EV> {
    component: RxFMElement<T, E>;
    event: Observable<EV>;
}
export declare type Component<T extends ElementType = ElementType, E extends EventType = never> = Observable<RxFMElement<T, E>>;
export declare class RxFMElement<T extends ElementType, E extends EventType = never> {
    readonly element: T;
    constructor(element: T);
    dispatch<K extends string, V>(type: K, value: V): RxFMElement<T, E | EventType<K, V>>;
    capture<K extends EventKeys<E>>(type: K): ICapture<T, EventDelete<E, K>, CustomEvent<EventValue<E, K>>>;
    capture<K extends keyof ElementEventMap>(type: K): ICapture<T, E, ElementEventMap[K]>;
    capture<K extends string>(type: K): ICapture<T, E, Event>;
    inject<EC, EV, K extends string, V>(capture: ICapture<T, EC, EV>, operator: OperatorFunction<EV, EmitEvent<K, V>>): Component<T, EC | EventType<K, V>>;
    inject<EC, EV>(capture: ICapture<T, EC, EV>, operator?: OperatorFunction<EV, any>): Component<T, EC>;
}
export declare type ComponentOperator<T extends ElementType, E extends EventType = never, O extends EventType = E> = (component: Component<T, E>) => Component<T, O>;
export declare function show<T extends ElementType, E extends EventType = never>(visible: Observable<boolean | string | number>): OperatorFunction<RxFMElement<T, E>, RxFMElement<T, E> | null>;
