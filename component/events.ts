import { ComponentOperator, Component } from './';
import { merge, Observable, EMPTY, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

export function event<T extends Node, E>(
  event: ((node: T) => Observable<E>),
): ComponentOperator<T, E>
export function event<T extends Node, E>(
  eventType: string,
): ComponentOperator<T, E | Event>
export function event<T extends Node, E>(
  eventType: string,
  mappingFunction: (event: Event) => E,
): ComponentOperator<T, E>
export function event<T extends Node, E>(
  event: ((node: T) => Observable<E>) | string,
  mappingFunction?: (event: Event) => E,
): ComponentOperator<T, E> {
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
