import { fromEvent, Observable } from "rxjs";
import { tap, withLatestFrom } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "./components";
import { coerceToObservable } from "./utils";

/**
 * A map of the possible event names to event types for an RxFM element.
 */
export type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;

/**
 * The event type for a given rxfm element type and event name.
 */
export type EventType<T extends ElementType, E extends keyof ElementEventMap> =
  T extends HTMLInputElement ? ElementEventMap[E] & { target: HTMLInputElement } : ElementEventMap[E];

/**
 * A function to handle an element event in rxfm, or an observable emitting a handler function.
 */
export type EventHandler<T extends ElementType, E extends keyof ElementEventMap> =
  ((event: EventType<T, E>) => void) | Observable<(event: EventType<T, E>) => void>;

/**
 * Register a callback to an event on the source component's element. Similar to the RxJS built-in fromEvent operator but maps
 * back to the source component.
 * @param type The event type to listen to.
 * @param callback The function to execute when the event fires.
 * @returns A component operator which will add the event listener into the stream.
 */
export function event<T extends ElementType, E extends keyof ElementEventMap>(
  type: E,
  callback: EventHandler<T, E>,
): ComponentOperator<T> {
  return componentOperator(element => fromEvent(element, type).pipe(
    withLatestFrom(coerceToObservable(callback)),
    tap(([ev, callbackFn]) => callbackFn(ev as EventType<T, E>)),
  ));
}

/**
 * An object where keys are rxfm element event names and values are event handler functions.
 */
export type EventHandlers<T extends ElementType> = {
  [E in keyof ElementEventMap]?: EventHandler<T, E>;
};

/**
 * Register a set of callback functions to element events.
 * @param handlers An object where keys are event names and values are event handlers.
 * @returns A component operator which will add the event handlers to the stream.
 */
export function events<T extends ElementType>(handlers: EventHandlers<T>): ComponentOperator<T> {
  return (source: Component<T>) => Object.keys(handlers).reduce((result, eventType: keyof ElementEventMap) => {
    const handler = handlers[eventType];
    if (!handler) return result;
    return result.pipe(
      event(eventType, handler),
    );
  }, source);
}
