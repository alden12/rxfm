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

export interface IExtractedEventComponent<T extends Node, E, EX> extends IComponent<T, E> {
  extractedEvents: Observable<EX>;
}
export type ExtractedEventComponent<T extends Node, E, EX> = Observable<IExtractedEventComponent<T, E, EX>>;

export type ExtractedEventComponentOperator<T extends Node, E, K extends keyof E> =
  (component: Component<T, E>) => ExtractedEventComponent<T, { [EK in Exclude<keyof E, K>]?: E[EK] }, E[K]>

export function extractEvent<T extends Node, E, K extends keyof E>(
  type: K,
): ExtractedEventComponentOperator<T, E, K> {
  return (component: Component<T, E>) => component.pipe(
    map(({ node, events }) => {

      const extractedEvents = events.pipe(
        filter(ev => type in ev),
        map(ev => ev[type]),
      );

      const remainingEvents = events.pipe(
        filter(ev => !(type in ev && Object.keys(ev).length === 1)),
        map(ev => {
          if (type in ev) {
            const cloned = { ...ev };
            delete { ...ev }[type];
            return cloned
          }
          return ev;
        })
      ) as Observable<{ [EK in Exclude<keyof E, K>]?: E[EK] }>;

      return {
        node,
        events: remainingEvents,
        extractedEvents,
      }
    }),
  );
}
