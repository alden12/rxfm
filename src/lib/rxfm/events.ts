import { fromEvent, Observable } from "rxjs";
import { tap, withLatestFrom } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "./components";
import { coerceToObservable } from "./utils";

export type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;

export type EventType<T extends ElementType, E extends keyof ElementEventMap> =
  T extends HTMLInputElement ? ElementEventMap[E] & { target: HTMLInputElement } : ElementEventMap[E];

export type EventHandler<T extends ElementType, E extends keyof ElementEventMap> =
  ((event: EventType<T, E>) => void) | Observable<(event: EventType<T, E>) => void>;

export function event<T extends ElementType, E extends keyof ElementEventMap>(
  type: E,
  callback: EventHandler<T, E>,
): ComponentOperator<T> {
  return componentOperator(element => fromEvent(element, type).pipe(
    withLatestFrom(coerceToObservable(callback)),
    tap(([ev, callbackFn]) => callbackFn(ev as EventType<T, E>)),
  ));
}

export type EventHandlers<T extends ElementType> = {
  [E in keyof ElementEventMap]?: EventHandler<T, E>;
};

export function events<T extends ElementType>(handlers: EventHandlers<T>): ComponentOperator<T> {
  return (source: Component<T>) => Object.keys(handlers).reduce((result, eventType: keyof ElementEventMap) => {
    const handler = handlers[eventType];
    if (!handler) return result;
    return result.pipe(
      event(eventType, handler),
    );
  }, source);
}
