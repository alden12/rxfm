import { Observable } from "rxjs";
import { ComponentOperator, ElementType } from "./components";
export declare type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;
export declare type EventType<T extends ElementType, E extends keyof ElementEventMap> = T extends HTMLInputElement ? ElementEventMap[E] & {
    target: HTMLInputElement;
} : ElementEventMap[E];
export declare function event<T extends ElementType, E extends keyof ElementEventMap>(type: E, callback: ((event: EventType<T, E>) => void) | Observable<(event: EventType<T, E>) => void>): ComponentOperator<T>;
