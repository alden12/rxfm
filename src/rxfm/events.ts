import { Component, IComponent } from './component';
import { merge, Observable, EMPTY, fromEvent } from 'rxjs';
import { map, share, filter } from 'rxjs/operators';

export type InjectEvent<T extends Node, E, K extends string, V> = (component: Component<T, E>) =>
  Component<T, {
    [KE in keyof (E & Record<K, V>)]?:
      KE extends keyof E
        ? KE extends K ? E[KE] | V : E[KE]
        : KE extends K ? V : never
  }>;

export function event<T extends Node, E, K extends string, V>(
  eventFunction: ((node: T) => Observable<Record<K, V>>),
): InjectEvent<T, E, K, V>

export function event<T extends Node, E, K extends string, V>(
  event: Observable<Record<K, V>>,
): InjectEvent<T, E, K, V>

export function event<T extends Node, E, K extends keyof HTMLElementEventMap>(
  eventType: K,
): InjectEvent<T, E, K, HTMLElementEventMap[K]>

export function event<T extends Node, E, K extends string>(
  eventType: K,
): InjectEvent<T, E, K, Event>

export function event<T extends Node, E, KT extends keyof HTMLElementEventMap, K extends string, V>(
  eventType: KT,
  mappingFunction: (event: Observable<HTMLElementEventMap[KT]>) => Observable<Record<K, V>>,
): InjectEvent<T, E, K, V>

export function event<T extends Node, E, K extends string, V>(
  eventType: string,
  mappingFunction: (event: Observable<Event>) => Observable<Record<K, V>>,
): InjectEvent<T, E, K, V>

export function event<T extends Node, E, K extends string, V>(
  event: ((node: T) => Observable<Record<K, V>>) | Observable<Record<K, V>> | string,
  mappingFunction?: (event: Observable<Event>) => Observable<Record<K, V>>,
): InjectEvent<T, E, K, V> {
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

function getEvents<T extends Node, V>(
  node: T,
  event: string | Observable<V> | ((node: T) => Observable<V>),
  mappingFunction?: (event: Observable<Event>) => Observable<V>,
): Observable<V | { [type: string]: Event }> {
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
