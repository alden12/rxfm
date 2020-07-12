import { Observable, of, fromEvent, OperatorFunction } from 'rxjs';
import { map, tap, startWith, distinctUntilChanged } from 'rxjs/operators';
import { EventKeys, EventValue, EventDelete, EmitEvent, ElementEventMap, EventType } from '../events';
import { component } from './creator';

export type ElementType = HTMLElement | SVGElement;

export interface ICapture<T extends ElementType, E extends EventType, EV> {
  component: Component<T, E>;
  event: Observable<EV>;
}

export type ComponentObservable<T extends ElementType, E extends EventType = never> = Observable<Component<T, E>>;

// /**
//  * Create an RxFM component to represent an html element of tag name K.
//  * @param tagName The HTML Element tag name (eg. 'div').
//  */
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
