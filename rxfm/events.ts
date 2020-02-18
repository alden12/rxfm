import { ComponentOperator, Component, IComponent } from './component';
import { merge, Observable, EMPTY, fromEvent } from 'rxjs';
import { map, share, filter } from 'rxjs/operators';

export function event<T extends Node, E, O, K extends string>(
  eventFunction: ((node: T) => Observable<Record<K, O>>),
): ComponentOperator<T, Partial<E>, Partial<E & Record<K, O>>>

export function event<T extends Node, E, O, K extends string>(
  event: Observable<Record<K, O>>,
): ComponentOperator<T, Partial<E>, Partial<E & Record<K, O>>>

export function event<T extends Node, E, K extends keyof HTMLElementEventMap>(
  eventType: K,
): ComponentOperator<T, Partial<E>, Partial<E & Record<K, HTMLElementEventMap[K]>>>

export function event<T extends Node, E, K extends string>(
  eventType: K,
): ComponentOperator<T, Partial<E>, Partial<E & Record<K, Event>>>

export function event<T extends Node, E, O, KT extends keyof HTMLElementEventMap, K extends string>(
  eventType: KT,
  mappingFunction: (event: Observable<HTMLElementEventMap[KT]>) => Observable<Record<K, O>>,
): ComponentOperator<T, Partial<E>, Partial<E & Record<K, O>>>

export function event<T extends Node, E, O, K extends string>(
  eventType: string,
  mappingFunction: (event: Observable<Event>) => Observable<Record<K, O>>,
): ComponentOperator<T, Partial<E>, Partial<E & Record<K, O>>>

export function event<T extends Node, E, O, K extends string>(
  event: ((node: T) => Observable<Record<K, O>>) | Observable<Record<K, O>> | string,
  mappingFunction?: (event: Observable<Event>) => Observable<Record<K, O>>,
): ComponentOperator<T, Partial<E>, Partial<E & Record<K, O>>> {
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
): Observable<O | { [type: string]: Event }> {
  if (typeof event === 'string') {
    return mappingFunction
      ? fromEvent(node, event).pipe(mappingFunction)
      : fromEvent(node, event).pipe(
        map(ev => ({ [event]: ev })),
      );
  } else if (typeof event === 'function') {
    return event(node);
  }
  return event;
}

export interface IMatchEventComponent<T extends Node, E, M> extends IComponent<T, E> {
  matchingEvents: Observable<M>;
}

export type MathcingEventComponent<T extends Node, E, M> = Observable<IMatchEventComponent<T, E, M>>;

export interface IMatch<T> { match: T }
export interface INoMatch<T> { noMatch: T }
export type Match<M, T extends M> = IMatch<M> | INoMatch<Exclude<T, M>>

export function match<T extends Node, M, E extends M>(
  matchingFunction: (event: E) => Match<M, E>,
): (component: Component<T, E>) => MathcingEventComponent<T, Exclude<E, M>, M> {
  return (component: Component<T, E>) => component.pipe(
    map(({ node, events }) => {

      const matchingEvents = events.pipe(
        map(ev => {
          const result = matchingFunction(ev);
          return 'match' in result ? result.match : undefined;
        }),
        filter(match => match !== undefined),
      );

      const remainingEvents = events.pipe(
        map(ev => {
          const result = matchingFunction(ev);
          return 'noMatch' in result ? result.noMatch : undefined;
        }),
        filter(noMatch => noMatch !== undefined),
      );

      return {
        node,
        events: remainingEvents,
        matchingEvents,
      }
    }),
  );
}
