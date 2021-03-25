import { fromEvent, Observable } from "rxjs";
import { tap, withLatestFrom } from "rxjs/operators";
import { componentOperator, ComponentOperator, ElementType } from "./components";
import { coerceToObservable } from "./utils";

export type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;

export type EventType<T extends ElementType, E extends keyof ElementEventMap> =
  T extends HTMLInputElement ? ElementEventMap[E] & { target: HTMLInputElement } : ElementEventMap[E];

export function event<T extends ElementType, E extends keyof ElementEventMap>(
  type: E,
  callback: ((event: EventType<T, E>) => void) | Observable<(event: EventType<T, E>) => void>,
): ComponentOperator<T> {
  return componentOperator(element => fromEvent(element, type).pipe(
    withLatestFrom(coerceToObservable(callback)),
    tap(([ev, callbackFn]) => callbackFn(ev as EventType<T, E>)),
  ));
}
