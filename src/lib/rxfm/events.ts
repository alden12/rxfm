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

function simpleEvent<T extends ElementType, E extends keyof ElementEventMap>(
  type: E,
  callback: EventHandler<T, E>,
): ComponentOperator<T> {
  const eventOperator: ComponentOperator<T> = componentOperator(element => fromEvent(element, type).pipe(
    withLatestFrom(coerceToObservable(callback)),
    tap(([ev, callbackFn]) => callbackFn(ev as EventType<T, E>)),
  ));

  return eventOperator;
}

type SimpleEventOperator = {
  <T extends ElementType, E extends keyof ElementEventMap>(type: E, callback: EventHandler<T, E>): ComponentOperator<T>;
};

type EventOperators = {
  [E in keyof ElementEventMap]: <T extends ElementType>(callback: EventHandler<T, E>) => ComponentOperator<T>;
};

export type EventOperator = SimpleEventOperator & EventOperators;

function buildEventOperator(): EventOperator {
  const handler: ProxyHandler<EventOperator> = {
    apply: (_, __, args: [keyof ElementEventMap, EventHandler<ElementType, keyof ElementEventMap>]) => simpleEvent(...args),
    get: (_, prop: keyof ElementEventMap) => (callback: EventHandler<ElementType, keyof ElementEventMap>) => simpleEvent(prop, callback),
  };
  return new Proxy((() => {}) as any, handler);
}

/**
 * Register a callback to an event on the source component's element. Similar to the RxJS built-in `fromEvent` operator but
 * operates on a component and maps back to the source component.
 * Alternatively event operators for specific event types may be accessed directly as properties eg: `event.click(handler)`.
 * @param type The event type to listen to.
 * @param callback The function, or observable emitting a function, to execute when the event fires.
 * @returns A component operator which will add the event listener into the stream.
 */
export const event = buildEventOperator();

/**
 * An object where keys are rxfm element event names and values are event handler functions.
 */
export type EventHandlers<T extends ElementType> = {
  [E in keyof ElementEventMap]?: EventHandler<T, E>;
};

/**
 * Register a set of callback functions to the source component's element events.
 * @param handlers An object where keys are event names and values are event handler functions or observables emitting handler
 * functions.
 * @returns A component operator which will add the event handlers to the stream.
 */
export function events<T extends ElementType>(handlers: EventHandlers<T>): ComponentOperator<T> {
  return (source: Component<T>) => Object.keys(handlers).reduce((result, eventType) => {
    const handler = handlers[eventType as keyof ElementEventMap] as EventHandler<T, keyof ElementEventMap>;
    if (!handler) return result;
    return result.pipe(
      simpleEvent<T, keyof ElementEventMap>(eventType as keyof ElementEventMap, handler),
    );
  }, source);
}
