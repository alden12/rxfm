import { Observable } from "rxjs";
import { ComponentOperator, ElementType } from "./components";
/**
 * A map of the possible event names to event types for an RxFM element.
 */
export declare type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;
/**
 * The event type for a given rxfm element type and event name.
 */
export declare type EventType<T extends ElementType, E extends keyof ElementEventMap> = T extends HTMLInputElement ? ElementEventMap[E] & {
    target: HTMLInputElement;
} : ElementEventMap[E];
/**
 * A function to handle an element event in rxfm, or an observable emitting a handler function.
 */
export declare type EventHandler<T extends ElementType, E extends keyof ElementEventMap> = ((event: EventType<T, E>) => void) | Observable<(event: EventType<T, E>) => void>;
/**
 * Register a callback to an event on the source component's element. Similar to the RxJS built-in `fromEvent` operator but
 * operates on a component and maps back to the source component.
 * @param type The event type to listen to.
 * @param callback The function, or observable emitting a function, to execute when the event fires.
 * @returns A component operator which will add the event listener into the stream.
 */
export declare function event<T extends ElementType, E extends keyof ElementEventMap>(type: E, callback: EventHandler<T, E>): ComponentOperator<T>;
/**
 * An object where keys are rxfm element event names and values are event handler functions.
 */
export declare type EventHandlers<T extends ElementType> = {
    [E in keyof ElementEventMap]?: EventHandler<T, E>;
};
/**
 * Register a set of callback functions to the source component's element events.
 * @param handlers An object where keys are event names and values are event handler functions or observables emitting handler
 * functions.
 * @returns A component operator which will add the event handlers to the stream.
 */
export declare function events<T extends ElementType>(handlers: EventHandlers<T>): ComponentOperator<T>;
