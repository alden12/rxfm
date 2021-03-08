import { fromEvent } from "rxjs";
import { tap } from "rxjs/operators";
import { componentOperator, ComponentOperator, ElementType } from "./components";

/**
 * The possible event types for an RxFM element.
 */
export type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;

/**
 * Register a callback to an event on the source component's element. Similar to the RxJS built-in fromEvent operator but maps
 * back to the source component.
 * @param type The event type to listen to.
 * @param callback The function to execute when the event fires.
 * @returns A component operator which will add the event listener into the stream.
 */
export function event<T extends ElementType, E extends keyof ElementEventMap>(
  type: E,
  callback: (event: ElementEventMap[E]) => void,
): ComponentOperator<T> {
  return componentOperator(element => fromEvent(element, type).pipe(
    tap(callback),
  ));
}
