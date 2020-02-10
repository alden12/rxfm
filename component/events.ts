import { ComponentOperator, Component } from './';
import { merge, Observable, EMPTY, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

export function event<T extends Node, E, O>(
  event: ((node: T) => Observable<O>),
): ComponentOperator<T, E, E | O>
export function event<T extends Node, E>(
  eventType: string,
): ComponentOperator<T, E, E | Event>
export function event<T extends Node, E, O>(
  eventType: string,
  mappingFunction: (event: Event) => O,
): ComponentOperator<T, E, E | O>
export function event<T extends Node, E, O>(
  event: ((node: T) => Observable<O>) | string,
  mappingFunction?: (event: Event) => O,
): ComponentOperator<T, E, E | O> {
  return (component: Component<T, E>) => component.pipe(
    map(({ node, events }) => ({
      node,
      events: merge<E>(
        events || EMPTY,
        typeof event === 'string'
          ? mappingFunction ? fromEvent(node, event).pipe(map(mappingFunction)) : fromEvent(node, event)
          : event(node),
      ),
    })),
  );
}
