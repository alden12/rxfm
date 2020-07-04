import { Observable, of, fromEvent, OperatorFunction } from 'rxjs';
import { map, tap, startWith, distinctUntilChanged } from 'rxjs/operators';
import { EventKeys, EventValue, EventDelete } from '../utils';
import { EmitEvent, ElementEventMap } from '../events';
import { component } from './creator';

export type ElementType = HTMLElement | SVGElement;

export type EventType<K extends string = string, V = any> = Record<K, V>;

// Deprecated
// tslint:disable: max-line-length
export type EventsFor <T extends Element, E extends EventType> = T & {
  addEventListener<K extends EventKeys<E>>(type: K, listener: (this: T, ev: CustomEvent<EventValue<E, K>>) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends EventKeys<E>>(type: K, listener: (this: T, ev: CustomEvent<EventValue<E, K>>) => any, options?: boolean | EventListenerOptions): void;
};
// tslint:enable: max-line-length

export interface ICapture<T extends ElementType, E extends EventType, EV> {
  component: Component<T, E>;
  event: Observable<EV>;
}

export type ComponentObservable<T extends ElementType, E extends EventType = never> = Observable<Component<T, E>>;

// export type ComponentOrElementObservable<T extends ElementType, E extends EventType = never> =
//   Observable<T | Component<T, E>>;

export class Component<T extends ElementType, E extends EventType = never> {

  public static readonly from = component;

  constructor(public readonly element: T) {}

  public dispatch<K extends string, V>(type: K, value: V): Component<T, E | EventType<K, V>> {
    this.element.dispatchEvent(new CustomEvent(type, { detail: value, bubbles: true }));
    return this;
  }

  public capture<K extends EventKeys<E>>(type: K): ICapture<T, EventDelete<E, K>, CustomEvent<EventValue<E, K>>>
  public capture<K extends keyof ElementEventMap>(type: K): ICapture<T, E, ElementEventMap[K]>
  public capture<K extends string>(type: K): ICapture<T, E, Event>
  public capture<K extends string>(type: K): ICapture<T, any, any> {
    return {
      component: this,
      event: fromEvent(this.element, type).pipe(
        tap(ev => ev instanceof CustomEvent && ev.stopPropagation()),
      ),
    };
  }

  public inject<EC, EV, K extends string, V>(
    capture: ICapture<T, EC, EV>,
    operator: OperatorFunction<EV, EmitEvent<K, V>>,
  ): ComponentObservable<T, EC | EventType<K, V>>
  public inject<EC, EV>(
    capture: ICapture<T, EC, EV>,
    operator?: OperatorFunction<EV, any>,
  ): ComponentObservable<T, EC>
  public inject<EC, EV>(
    // tslint:disable-next-line: no-shadowed-variable
    { component, event }: ICapture<T, EC, EV>,
    operator?: OperatorFunction<EV, any>,
  ): ComponentObservable<T, any> {
    return (operator ? event.pipe(operator) : event).pipe(
      map(ev => ev instanceof EmitEvent ? component.dispatch(ev.type, ev.value) : component),
      startWith(component),
      distinctUntilChanged(),
    );
  }
}

export type ComponentOperator<T extends ElementType, E extends EventType = never, O = E> =
  (component: ComponentObservable<T, E>) => ComponentObservable<T, O>;

// export function coerceToComponent<T extends ElementType, E extends EventType = never>(
// ): OperatorFunction<T | Component<T, E>, Component<T, E>> {
//   return (component: Observable<T | Component<T, E>>) => component.pipe(
//     map(_component => _component instanceof Component ? _component : new Component<T, E>(_component)),
//   );
// }

////

export type ComponentOld<T extends ElementType, E extends Record<any, any> = never> =
  Observable<T | EventsFor<T, E>>;
  // Observable<T> | Observable<EventsFor<T, E>>;
  // E extends never ? Observable<T> : Observable<EventsFor<T, E>>;
  // Observable<E extends never ? T : EventsFor<T, E>>;

// export type ComponentType<T extends Component<ElementType, Record<any, any> | never>> =
//   T extends Component<infer CT, infer E> ? Observable<EventsFor<CT, E>> : never;

// export type ComponentOperator<T extends ElementType, E = never, O = E> = (component: Component<T, E>) => Component<T, O>
export type ComponentOperatorOld<T extends ElementType, E = never, O = E> =
  (component: ComponentOld<T, E>) => Observable<EventsFor<T, O>>;
// export type ComponentOperator<T extends ElementType, E = never, O = E> =
//   O extends never ? (component: Component<T, E>) => Observable<T> : (component: Component<T, E>) => Component<T, O>;
  // E extends never ?
  //   O extends never ?
  //     (component: Observable<T>) => Observable<T> :
  //       (component: Observable<T>) => ComponentType<Component<T, O>> :
  //         (component: ComponentType<Component<T, E>>) => ComponentType<Component<T, O>>
;

export function componentOld<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
): Observable<HTMLElementTagNameMap[K]> {
  return of(tagName).pipe(
    map(name => document.createElement(name)),
  );
}

// export const SVGNamespace = 'http://www.w3.org/2000/svg';

// export function SVGComponentOld<K extends keyof SVGElementTagNameMap>(
//   tagName: K,
// ): Observable<SVGElementTagNameMap[K]> {
//   return of(tagName).pipe(
//     map(name => document.createElementNS(SVGNamespace, name)),
//   );
// }

////

// /**
// tslint:disable-next-line: max-line-length
//  * An interface to describe an RxFM component object. This consists of an HTML Node which will represent the component
//  * in the view along with an observable emitting any events emitted by the component or upstream components.
//  * @typeParam T The Node type for this component.
//  * @typeParam E The event type for this component.
//  */
// export interface IComponent<T extends Node, E = {}> {
//   /**
//    * The HTML Node represented by this component.
//    */
//   node: T;
//   /**
//    * Events emitted by this component and any upstream components.
//    */
//   events: Observable<E>;
// }

// /**
//  * A type to describe an RxFM component. This consists of an observable emitting an IComponent interface.
//  * @typeParam T The Node type for this component.
//  * @typeParam E The event type for this component.
//  */
// export type ComponentOld<T extends Node, E = {}> = Observable<IComponent<T, E>>;

// /**
//  * A function to operate on an RxFM Component stream. Takes a component observable and returns another component
//  * observable.
//  * @typeParam T The Node type of the component.
//  * @typeParam E The event type of the incoming component.
//  * @typeParam O The event type of the outgoing component.
//  */
// export type ComponentOperatorOld<T extends Node, E, O = E> = (component: ComponentOld<T, E>) => ComponentOld<T, O>;

// // TODO: Deprecate in favor of always passing string directly to children operator?
// /**
//  * Create an RxFM component to represent a text node.
//  * @param textOrTextObservable The node text as a string, number or observable emitting either of these types.
//  */
// export function text(
//   textOrTextObservable: string | number | Observable<string | number>
// ): Observable<IComponent<Text, {}>> {
// tslint:disable-next-line: max-line-length
//   const textObservable = textOrTextObservable instanceof Observable ? textOrTextObservable : of(textOrTextObservable);
//   const node = document.createTextNode("");
//   return textObservable.pipe(
//     map(content => typeof content === 'string' ? content : content.toString()),
//     map(content => {
//       node.nodeValue = content;
//       return { node, events: EMPTY };
//     }),
//     distinctUntilKeyChanged('node'),
//   );
// }

// /**
//  * Create an RxFM component to represent an html element of tag name K.
//  * @param tagName The HTML Element tag name (eg. 'div').
//  */
// export function componentOld<K extends keyof HTMLElementTagNameMap>(
//   tagName: K,
// ): ComponentOld<HTMLElementTagNameMap[K], {}> {
//   return of({ node: document.createElement(tagName), events: EMPTY });
// }
