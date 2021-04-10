import { fromEvent, Observable } from "rxjs";
import { tap, withLatestFrom } from "rxjs/operators";
import { componentOperator, ComponentOperator, ElementType } from "./components";
import { coerceToObservable } from "./utils";

/**
 * The possible event types for an RxFM element.
 */
export type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;

export type EventType<T extends ElementType, E extends keyof ElementEventMap> =
  T extends HTMLInputElement ? ElementEventMap[E] & { target: HTMLInputElement } : ElementEventMap[E];

/**
 * Register a callback to an event on the source component's element. Similar to the RxJS built-in fromEvent operator but maps
 * back to the source component.
 * @param type The event type to listen to.
 * @param callback The function to execute when the event fires.
 * @returns A component operator which will add the event listener into the stream.
 */
export function event<T extends ElementType, E extends keyof ElementEventMap>(
  type: E,
  callback: ((event: EventType<T, E>) => void) | Observable<(event: EventType<T, E>) => void>,
): ComponentOperator<T> {
  return componentOperator(element => fromEvent(element, type).pipe(
    withLatestFrom(coerceToObservable(callback)),
    tap(([ev, callbackFn]) => callbackFn(ev as EventType<T, E>)),
  ));
}
