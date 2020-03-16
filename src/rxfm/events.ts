import { Component, IComponent, ComponentOperator } from './components';
import { merge, Observable, EMPTY, fromEvent, OperatorFunction } from 'rxjs';
import { map, share, filter } from 'rxjs/operators';

export type InjectEvent<T extends Node, E, K extends string, V> = ComponentOperator<T, E, {
  [KE in keyof (E & Record<K, V>)]?:
    KE extends keyof E
      ? KE extends K ? E[KE] | V : E[KE]
      : KE extends K ? V : never
}>;

export type HTMLElementEvent<T extends Node, K extends string> =
  (K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : Event) & { target: T };

// tslint:disable: max-line-length
export function event<T extends Node, E, K extends string, V>(event: Observable<Record<K, V>> | ((node: T) => Observable<Record<K, V>>)): InjectEvent<T, E, K, V>
export function event<T extends Node, E, ET extends string>(eventType: ET): InjectEvent<T, E, ET, HTMLElementEvent<T, ET>>
export function event<T extends Node, E, ET extends string, K extends string, R>(eventType: ET, op: OperatorFunction<HTMLElementEvent<T, ET>, Record<K, R>>): InjectEvent<T, E, K, R>
export function event<T extends Node, E, ET extends string, K extends string, OP1, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op: OperatorFunction<OP1, Record<K, R>>): InjectEvent<T, E, K, R>
export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op: OperatorFunction<OP2, Record<K, R>>): InjectEvent<T, E, K, R>
export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op: OperatorFunction<OP3, Record<K, R>>): InjectEvent<T, E, K, R>
export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op: OperatorFunction<OP4, Record<K, R>>): InjectEvent<T, E, K, R>
export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op: OperatorFunction<OP5, Record<K, R>>): InjectEvent<T, E, K, R>
export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, OP6, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op6: OperatorFunction<OP5, OP6>, op: OperatorFunction<OP6, Record<K, R>>): InjectEvent<T, E, K, R>
export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, OP6, OP7, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op6: OperatorFunction<OP5, OP6>, op7: OperatorFunction<OP6, OP7>, op: OperatorFunction<OP7, Record<K, R>>): InjectEvent<T, E, K, R>
export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, OP6, OP7, OP8, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op6: OperatorFunction<OP5, OP6>, op7: OperatorFunction<OP6, OP7>, op8: OperatorFunction<OP7, OP8>, op: OperatorFunction<OP8, Record<K, R>>): InjectEvent<T, E, K, R>
// tslint:enable: max-line-length

export function event<T extends Node, E, ET extends string, K extends string, V>(
  eventType: ET | Observable<Record<K, V>> | ((node: T) => Observable<Record<K, V>>),
  ...operators: OperatorFunction<any, any>[]
): InjectEvent<T, E, K, V> {
  return (component: Component<T, E>) => component.pipe(
    map(({ node, events }) => ({
      node,
      events: merge<E>(
        events || EMPTY,
        getEvents(node, eventType, ...operators),
      ).pipe(
        share() // Is this share needed? Add in only when about to be shared? Future events rebuild if not shared here?
      ),
    })),
  );
}

function getEvents<T extends Node>(
  node: T,
  eventType: string | Observable<Record<string, any>> | ((node: T) => Observable<Record<string, any>>),
  ...operators: OperatorFunction<any, any>[]
): Observable<Record<string, any>> {
  if (typeof eventType === 'string') {
    return operators.length > 0
      ? operators.reduce((result, op) => result.pipe(op), fromEvent(node, eventType)) as Observable<Record<string, any>>
      : fromEvent(node, eventType).pipe(
        map(evt => ({ [eventType]: evt } as Record<string, any>)),
      );
  } else if (typeof eventType === 'function') {
    return eventType(node);
  }
  return eventType as Observable<Record<string, any>>;
}

export interface IExtractedEventComponent<T extends Node, E, EX> extends IComponent<T, E> {
  extractedEvents: Observable<EX>;
}
export type ExtractedEventComponent<T extends Node, E, EX> = Observable<IExtractedEventComponent<T, E, EX>>;

export type ExtractedEvent<T extends Node, E, K extends keyof E> =
  (component: Component<T, E>) => ExtractedEventComponent<T, { [EK in Exclude<keyof E, K>]?: E[EK] }, E[K]>

export function extractEvent<T extends Node, E, K extends keyof E>(
  type: K,
): ExtractedEvent<T, E, K> {
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
