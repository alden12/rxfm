import { ComponentOperator, Component } from './';
import { merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function event<T extends Node, E = undefined>(
  event: Observable<E>
): ComponentOperator<T, E> {
  return (component: Component<T, E>) => component.pipe(
    map(({ node, events }) => ({
      node,
      events: merge<E>(events, event),
    })),
  );
}
