import { ComponentOperator, Component, IComponent } from './';
import { merge, Observable, EMPTY, fromEvent } from 'rxjs';
import { map, share, filter, switchMap } from 'rxjs/operators';

export function event<T extends Node, E, O>(
  eventFunction: ((node: T) => Observable<O>),
): ComponentOperator<T, E, E | O>
export function event<T extends Node, E, O>(
  event: Observable<O>,
): ComponentOperator<T, E, E | O>
export function event<T extends Node, E, K extends keyof HTMLElementEventMap>(
  eventType: K,
): ComponentOperator<T, E, E | HTMLElementEventMap[K]>
export function event<T extends Node, E>(
  eventType: string,
): ComponentOperator<T, E, E | Event>
export function event<T extends Node, E, O, K extends keyof HTMLElementEventMap>(
  eventType: K,
  mappingFunction: (event: Observable<HTMLElementEventMap[K]>) => Observable<O>,
): ComponentOperator<T, E, E | O>
export function event<T extends Node, E, O>(
  eventType: string,
  mappingFunction: (event: Observable<Event>) => Observable<O>,
): ComponentOperator<T, E, E | O>
export function event<T extends Node, E, O>(
  event: ((node: T) => Observable<O>) | Observable<O> | string,
  mappingFunction?: (event: Observable<Event>) => Observable<O>,
): ComponentOperator<T, E, E | O> {
  return (component: Component<T, E>) => component.pipe(
    map(({ node, events }) => ({
      node,
      events: merge<E>(
        events || EMPTY,
        getEvents(node, event, mappingFunction),
      ).pipe(
        share()
      ),
    })),
  );
}

function getEvents<T extends Node, O>(
  node: T,
  event: string | Observable<O> | ((node: T) => Observable<O>),
  mappingFunction?: (event: Observable<Event>) => Observable<O>,
): Observable<O | Event> {
  if (typeof event === 'string') {
    return mappingFunction ? fromEvent(node, event).pipe(mappingFunction) : fromEvent(node, event);
  } else if (typeof event === 'function') {
    return event(node);
  }
  return event;
}

export interface IMatchEventComponent<T extends Node, E, S> extends IComponent<T, E> {
  matchingEvents: Observable<S>;
}

export type MathcingEventComponent<T extends Node, E, S> = Observable<IMatchEventComponent<T, E, S>>;

export function match<T extends Node, Ex, E extends Ex>(
  matchingFunction: (event: E) => Ex | null,
): (component: Component<T, E>) => MathcingEventComponent<T, Exclude<E, Ex>, Ex> {
  return (component: Component<T, E>) => component.pipe(
    map(({ node, events }) => {

      const matchingEvents = events.pipe(
        filter(ev => matchingFunction(ev) !== null),
      ) as Observable<Ex>;

      const remainingEvents = events.pipe(
        filter(ev => matchingFunction(ev) === null),
      ) as Observable<Exclude<E, Ex>>;

      return {
        node,
        events: remainingEvents,
        matchingEvents,
      }
    }),
  );
}

// export function extract<T extends Node, Ex, E extends Ex>(
//   component: Component<T, E>,
//   matchingFunction: (event: E) => boolean,
// ): [Component<T, Exclude<E, Ex>>, Observable<Ex>] {

//   const filteredComponent = component.pipe(
//     map(({ node, events }) => ({
//       node,
//       events: events.pipe(
//         filter(ev => !matchingFunction(ev))
//       ) as Observable<Exclude<E, Ex>>,
//     }))
//   );

//   const matching = component.pipe(
//     switchMap(({ events }) => events),
//     filter(matchingFunction),
//   ) as Observable<Ex>;

//   return [filteredComponent, matching];
// }
