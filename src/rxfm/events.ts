import { Component, IComponent, ComponentOperator } from './components';
import { merge, Observable, EMPTY, fromEvent, OperatorFunction } from 'rxjs';
import { map, share, filter } from 'rxjs/operators';

/**
 * A type to inject an event into the component stream. Injected as a single key object { [key: K]: V }.
 * @typeParam T The host node type.
 * @typeParam E The incoming event type.
 * @typeParam K The string key of the outgoing event to inject.
 * @typeParam V The value type of the outgoing event to inject.
 */
export type InjectEvent<T extends Node, E, K extends string, V> = ComponentOperator<T, E, {
  [KE in keyof (E & Record<K, V>)]?:
    KE extends keyof E
      ? KE extends K ? E[KE] | V : E[KE]
      : KE extends K ? V : never
}>;

/**
 * A type to add event target type (U) to an HTML event (T).
 */
export type TargetType<T extends Event, U extends Node> = {
  [K in keyof (T & Record<'target', U>)]: (T & Record<'target', U>)[K];
};

/**
 * A type to add event target type (T) to an HTML element event of string id K (eg. 'click').
 */
export type HTMLElementEvent<T extends Node, K extends string> =
  K extends keyof HTMLElementEventMap ? TargetType<HTMLElementEventMap[K], T> : TargetType<Event, T>;

/**
 * An observable operator to add an event into the component stream, these events will bubble into parent components
 * until they are captured.
 * @param event The event or event type to inject into the stream. This may be either an HTML element event type string
 * (eg. 'click'), an observable, or a function taking the host node and returning an observable.
 * @param operators A spread array of observable operators to transform the event as desired before it is injected
 * into the component stream. The final operator must return a Record.
 */
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

/**
 * A function to coerce the input of the 'event' operator to be an observable emitting a Record.
 */
function getEvents<T extends Node>(
  node: T,
  eventType: string | Observable<Record<string, any>> | ((node: T) => Observable<Record<string, any>>),
  ...operators: OperatorFunction<any, any>[]
): Observable<Record<string, any>> {
  if (typeof eventType === 'string') { // If a string event id was passed.
    return operators.length > 0 // If operators were passed, get event form node and pipe through operators.
      ? operators.reduce((result, op) => result.pipe(op), fromEvent(node, eventType)) as Observable<Record<string, any>>
      : fromEvent(node, eventType).pipe( // Otherwise get event from node and map to a Record.
        map(evt => ({ [eventType]: evt } as Record<string, any>)),
      );
  } else if (typeof eventType === 'function') { // If a function was passed.
    return eventType(node); // Return the result of the function on the host node.
  }
  return eventType as Observable<Record<string, any>>; // Else return input observable.
}

/**
 * An interface to describe a component with an an extra extracted event parameter containing an observable emitting
 * the extracted event.
 */
export interface IExtractedEventComponent<T extends Node, E, EX> extends IComponent<T, E> {
  extractedEvents: Observable<EX>;
}

/**
 * An observable emitting an IComponent object with an extra extracted event parameter containing an observable
 * emitting the extracted event.
 */
export type ExtractedEventComponent<T extends Node, E, EX> = Observable<IExtractedEventComponent<T, E, EX>>;

/**
 * A type describing an component observable operator which extracts a single event from the incoming event stream.
 */
export type ExtractedEvent<T extends Node, E, K extends keyof E> =
  (component: Component<T, E>) => ExtractedEventComponent<T, { [EK in Exclude<keyof E, K>]?: E[EK] }, E[K]>

/**
 * An observable operator to extract an event from the component event stream. Prevents the event from bubbling
 * further into parent components.
 * @param type The string key id of the event to extract.
 * @returns A component with an extra parameter containing an observable emitting the extracted event.
 */
export function extractEvent<T extends Node, E, K extends keyof E>(
  type: K,
): ExtractedEvent<T, E, K> {
  return (component: Component<T, E>) => component.pipe(
    map(({ node, events }) => {

      const extractedEvents = events.pipe( // Create an observable emitting the extracted event.
        filter(ev => type in ev),
        map(ev => ev[type]),
      );

      const remainingEvents = events.pipe( // Create an observable emitting other events.
        filter(ev => !(type in ev && Object.keys(ev).length === 1)),
        map(ev => {
          if (type in ev) {
            const cloned = { ...ev }; // Clone the incoming event.
            delete { ...ev }[type]; // Delete the extracted event.
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
