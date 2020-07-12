import { ElementType, ComponentOperator, ComponentObservable, ICapture, EventType } from './components';
import { Observable, OperatorFunction, EMPTY } from 'rxjs';
import { EventDelete, EventKeys, EventValue } from './utils';
import { switchMap, map } from 'rxjs/operators';

export type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;

export type Events<E extends EventType, K extends string> =
  K extends EventKeys<E> ? CustomEvent<EventValue<E, K>> : K extends keyof ElementEventMap ? ElementEventMap[K] : Event;

export class EmitEvent<K extends string, V> {
  constructor(
    public readonly type: K,
    public readonly value: V,
  ) {}
}

export function emitEvent<T, K extends string, V>(
  type: K,
  mappingFunction: (event: T) => V,
): OperatorFunction<T, EmitEvent<K, V>> {
  return (event$: Observable<T>) => event$.pipe(
    map(ev => new EmitEvent(type, mappingFunction(ev))),
  );
}

export type InjectEvent<T extends ElementType, E extends EventType, ET extends string, EV> =
  EV extends EmitEvent<infer K, infer V> ?
    ComponentOperator<T, E, EventDelete<E, ET> | EventType<K, V>> :
    ComponentOperator<T, E, EventDelete<E, ET>>
;

// /**
//  * An observable operator to add an event into the component stream, these events will bubble into parent components
//  * until they are captured.
//  * @param event The event or event type to inject into the stream. This may be either an HTML element event type string
//  * (eg. 'click'), an observable, or a function taking the host node and returning an observable.
//  * @param operators A spread array of observable operators to transform the event as desired before it is injected
//  * into the component stream. The final operator must return a Record.
//  */
export function event<T extends ElementType, EV, E extends EventType = never>(
  event: Observable<EV> | ((node: T) => Observable<EV>),
): EV extends EmitEvent<infer K, infer V> ? ComponentOperator<T, E | Record<K, V>> : ComponentOperator<T, E>
export function event<T extends ElementType, ET extends string, R, E extends EventType = never>(
  eventType: ET,
  operatorFunction: OperatorFunction<Events<E, ET>, R>,
): InjectEvent<T, E, ET, R>
export function event<T extends ElementType, ET extends string, O, OT extends string, E extends EventType = never>(
  eventType: ET,
  outputType: OT,
  mappingFunction: (event: Events<E, ET>) => O,
): InjectEvent<T, E, ET, Record<OT, O>>
export function event<
  T extends HTMLElement,
  E extends EventType = never,
  ET extends string = never,
  OT extends string = never,
  EV = never,
  R extends EventType = never
>(
  eventType: ET | Observable<EV> | ((node: T) => Observable<EV>),
  operatorOrOutputType?: OperatorFunction<Events<E, ET>, R> | OT,
  mappingFunction?: (event: Events<E, ET>) => EV,
): ComponentOperator<T, E, EventDelete<E, ET> | R> {

  return (component$: ComponentObservable<T, E>) => component$.pipe(
    switchMap(component => {
      const capture: ICapture<T, any, any> = typeof eventType === 'string' ? component.capture(eventType) : {
        component,
        event: eventType instanceof Observable ? eventType :
          typeof eventType === 'function' ? eventType(component.element) :
          EMPTY,
      };

      if (mappingFunction) {
        return component.inject(capture, emitEvent(operatorOrOutputType as OT, mappingFunction));
      } else if (operatorOrOutputType) {
        return component.inject(capture, operatorOrOutputType as OperatorFunction<Events<E, ET>, R>)
      }
      return component.inject(capture);
    })
  );
}
