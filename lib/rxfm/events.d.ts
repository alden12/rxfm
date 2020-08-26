import { ElementType, ComponentOperator } from './components';
import { Observable, OperatorFunction } from 'rxjs';
export declare type EventType<K extends string = string, V = any> = Record<K, V>;
export declare type EventKeys<T extends EventType> = T extends EventType<infer K, any> ? K : never;
export declare type EventValue<T extends EventType, K extends EventKeys<T>> = T extends EventType<K, infer V> ? V : never;
export declare type EventDelete<T extends EventType, K extends string> = T extends EventType<K, any> ? never : T;
export declare type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;
export declare type Events<E extends EventType, K extends string> = K extends EventKeys<E> ? CustomEvent<EventValue<E, K>> : K extends keyof ElementEventMap ? ElementEventMap[K] : Event;
export declare class EmitEvent<K extends string, V> {
    readonly type: K;
    readonly value: V;
    constructor(type: K, value: V);
}
export declare function emitEvent<T, K extends string, V>(type: K, mappingFunction: (event: T) => V): OperatorFunction<T, EmitEvent<K, V>>;
export declare type InjectEvent<T extends ElementType, E extends EventType, ET extends string, EV> = EV extends EmitEvent<infer K, infer V> ? ComponentOperator<T, E, EventDelete<E, ET> | EventType<K, V>> : ComponentOperator<T, E, EventDelete<E, ET>>;
export declare function event<T extends ElementType, EV, E extends EventType = never>(event: Observable<EV> | ((node: T) => Observable<EV>)): EV extends EmitEvent<infer K, infer V> ? ComponentOperator<T, E | EventType<K, V>> : ComponentOperator<T, E>;
export declare function event<T extends ElementType, ET extends string, R, E extends EventType = never>(eventType: ET, operatorFunction: OperatorFunction<Events<E, ET>, R>): InjectEvent<T, E, ET, R>;
export declare function event<T extends ElementType, ET extends string, O, OT extends string, E extends EventType = never>(eventType: ET, outputType: OT, mappingFunction: (event: Events<E, ET>) => O): InjectEvent<T, E, ET, Record<OT, O>>;
