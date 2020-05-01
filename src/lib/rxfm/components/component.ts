import { Observable, of, EMPTY } from 'rxjs';
import { map, distinctUntilKeyChanged } from 'rxjs/operators';
import { CustomEventTypes } from '../utils';

export type Component<T extends HTMLElement, E extends Record<any, any> = never> = Observable<CustomEventTypes<T, E>>;

export type ComponentOperator<T extends HTMLElement, E = never, O = E> = (component: Component<T, E>) => Component<T, O>

export function component<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
): Component<HTMLElementTagNameMap[K]> {
  return of(tagName).pipe(
    map(name => document.createElement(name)),
  );
}

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
