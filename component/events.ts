import { ComponentOperator, Component } from './';
import { merge, Observable, EMPTY, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

export function event<T extends Node, E = undefined>(
  event: ((node: T) => Observable<E>) | string,
): ComponentOperator<T, E> {
  return (component: Component<T, E>) => component.pipe(
    map(({ node, events }) => ({
      node,
      events: merge<E>(
        events || EMPTY,
        typeof event === 'string' ? fromEvent(node, event) : event(node),
      ),
    })),
  );
}
