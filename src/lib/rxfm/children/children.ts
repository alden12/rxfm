import { Observable, of, combineLatest, merge, EMPTY } from 'rxjs';
import { map, switchMap, debounceTime, shareReplay, distinctUntilChanged, mapTo, switchAll, share, startWith } from 'rxjs/operators';
// import { IComponent, ComponentOld, ComponentOperatorOld } from '../components';
import { childDiffer } from './child-differ';
import { SHARE_REPLAY_CONFIG } from '../utils';
import { EventsFor, ElementType, ComponentOperator, Component } from '../components';

export type NullLike = null | undefined | false;
export type StringLike = string | number;
export type ComponentLike<T extends ElementType, E> = EventsFor<T, E> | EventsFor<T, E>[];

/**
 * The possible types which can be added as a child component through the 'children' operator.
 */
// export type ChildComponent<T extends ElementType, E> =
//   string | number | NullLike |
//   Observable<string | number | NullLike | EventWrapper<T, E> | EventWrapper<T, E>[]>;

export type ChildComponent<T extends ElementType, E> =
  StringLike | NullLike | Observable<StringLike | NullLike | ComponentLike<T, E>>;

export type CoercedChildComponent = (ElementType | Text)[];

// TODO: Add distinct until changed to text children.

/**
 * Coerce any of the members of the ChildComponent type to be the most generic child component type.
 */
function coerceChildComponent<E>(
  childComponent: ChildComponent<ElementType, E>,
): Observable<CoercedChildComponent | null> {
  if (childComponent instanceof Observable) { // If observable.
    let node: Text; // Create outer reference to text node if it is needed.
    return childComponent.pipe(
      startWith(null),
      map(child => {
        if (typeof child === 'string' || typeof child === 'number') { // TODO: Do this whenever unrecognized type? Safer
          node = node || document.createTextNode(''); // If emission is text-like, create a text node or use existing.
          node.nodeValue = typeof child !== 'string' ? child.toString() : child; // Update text node value.
          return [node]; // Return component in an array.
        } else if (child !== undefined && child !== null && child !== false) {
          return Array.isArray(child) ? child : [child]; // If child was already a component, coerce to array and return
        }
        return null // Otherwise return null to indicate empty.
      }),
    );
  } else if (typeof childComponent === 'string' || typeof childComponent === 'number') {
    // If child is string-like, coerce to a string.
    const content = typeof childComponent !== 'string' ? childComponent.toString() : childComponent;
    const node = document.createTextNode(content); // Create text node with string value.
    return of([node]); // Return component in an array.
  }
  return of(null); // Otherwise return null to indicate empty.
}

/**
 * Update the child nodes of an element given the new state and previous state of child nodes.
 */
function updateElementChildren<T extends ElementType>(
  el: T,
  previousChildren: Node[],
  newChildren: Node[]
): T {
  const diff = childDiffer(previousChildren, newChildren); // Get the difference between the new and old state.

  diff.removed.forEach(node => el.removeChild(node)); // Remove all deleted nodes.
  el.append( // Append any nodes to the element which should appear after existing nodes.
    ...diff.updated
      .filter(update => !update.insertBefore)
      .map(update => update.node)
  );
  diff.updated // Add any nodes which should go in between existing nodes.
    .filter(update => update.insertBefore)
    .forEach(update => el.insertBefore(update.node, update.insertBefore || null));

  return el;
}

export type ArrayType<T extends any[]> = T extends (infer A)[] ? A : never;

// export type ChildEvent<T extends ChildComponent<ElementType, any>> =
//   T extends Observable<ComponentLike<infer _, infer E>> ? E : never;

export type ChildEvents<T extends ChildComponent<ElementType, any>[]> = ArrayType<{
  [P in keyof T]: T[P] extends Observable<ComponentLike<infer _, infer E>> ? E : never;
}>;

// type StringChildTest = ChildEvents<string[]>;

export function children<T extends ElementType, C extends ChildComponent<ElementType, any>[], E = never>(
  ...childComponents: C
): ComponentOperator<T, E, E | ChildEvents<C>> {
  return (component: Component<T, E>) => component.pipe(
    switchMap(node => {
      let previousNodes: Node[] = [];
      return combineLatest<(CoercedChildComponent | null)[]>(
        ...childComponents.map(coerceChildComponent) // Coerce all child nodes to be most generic type and combine.
      ).pipe(
        debounceTime(0), // Prevent repeated emission for simultaneous changes.
        //  Remove empty children then flatten.
        map(childrenOrNull => childrenOrNull.filter(child => child !== null) as CoercedChildComponent[]),
        map(notFlat => notFlat.reduce<CoercedChildComponent>((flat, comps) => flat.concat(comps), [])),
        map(nodes => {
          updateElementChildren(node, previousNodes, nodes); // Update the component child nodes.
          previousNodes = nodes; // Store nodes for reference.
          return node;
        }),
        distinctUntilChanged(),
      );
    }),
  );
}

// /**
//  * An observable operator to add children to a component.
//  * @param childComponents A spread array of ChildComponent type to add to this component. These may take a number of
// tslint:disable: max-line-length
//  * forms, the simplest of which are strings, numbers or booleans or observables emitting any of these. Other components
//  * may also be passed (Observables emitting the IComponent interface). Finally Observables emitting IComponent arrays
//  * may be passed, this is used for adding dynamic arrays of components (see the 'generate' operator).
//  */
// // tslint:disable: max-line-length
// export function children<T extends HTMLElement, EV>(): ComponentOperatorOld<T, EV>
// export function children<T extends HTMLElement, EV, A = {}, TA extends Node = Node>(childA: ChildComponent<TA, A>): ComponentOperatorOld<T, EV, EV & A>
// export function children<T extends HTMLElement, EV, A = {}, TA extends Node = Node, B = {}, TB extends Node = Node>(childA: ChildComponent<TA, A>, childB: ChildComponent<TB, B>): ComponentOperatorOld<T, EV, EV & A & B>
// export function children<T extends HTMLElement, EV, A = {}, TA extends Node = Node, B = {}, TB extends Node = Node, C = {}, TC extends Node = Node>(childA: ChildComponent<TA, A>, childB: ChildComponent<TB, B>, childC: ChildComponent<TC, C>): ComponentOperatorOld<T, EV, EV & A & B & C>
// export function children<T extends HTMLElement, EV, A = {}, TA extends Node = Node, B = {}, TB extends Node = Node, C = {}, TC extends Node = Node, D = {}, TD extends Node = Node>(childA: ChildComponent<TA, A>, childB: ChildComponent<TB, B>, childC: ChildComponent<TC, C>, childD: ChildComponent<TD, D>): ComponentOperatorOld<T, EV, EV & A & B & C & D>
// export function children<T extends HTMLElement, EV, A = {}, TA extends Node = Node, B = {}, TB extends Node = Node, C = {}, TC extends Node = Node, D = {}, TD extends Node = Node, E = {}, TE extends Node = Node>(childA: ChildComponent<TA, A>, childB: ChildComponent<TB, B>, childC: ChildComponent<TC, C>, childD: ChildComponent<TD, D>, childE: ChildComponent<TE, E>): ComponentOperatorOld<T, EV, EV & A & B & C & D & E>
// export function children<T extends HTMLElement, EV, A = {}, TA extends Node = Node, B = {}, TB extends Node = Node, C = {}, TC extends Node = Node, D = {}, TD extends Node = Node, E = {}, TE extends Node = Node, F = {}, TF extends Node = Node>(childA: ChildComponent<TA, A>, childB: ChildComponent<TB, B>, childC: ChildComponent<TC, C>, childD: ChildComponent<TD, D>, childE: ChildComponent<TE, E>, childF: ChildComponent<TF, F>): ComponentOperatorOld<T, EV, EV & A & B & C & D & E & F>
// export function children<T extends HTMLElement, EV, A = {}, TA extends Node = Node, B = {}, TB extends Node = Node, C = {}, TC extends Node = Node, D = {}, TD extends Node = Node, E = {}, TE extends Node = Node, F = {}, TF extends Node = Node, G = {}, TG extends Node = Node>(childA: ChildComponent<TA, A>, childB: ChildComponent<TB, B>, childC: ChildComponent<TC, C>, childD: ChildComponent<TD, D>, childE: ChildComponent<TE, E>, childF: ChildComponent<TF, F>, childG: ChildComponent<TG, G>): ComponentOperatorOld<T, EV, EV & A & B & C & D & E & F & G>
// export function children<T extends HTMLElement, EV, A = {}, TA extends Node = Node, B = {}, TB extends Node = Node, C = {}, TC extends Node = Node, D = {}, TD extends Node = Node, E = {}, TE extends Node = Node, F = {}, TF extends Node = Node, G = {}, TG extends Node = Node, H = {}, TH extends Node = Node>(childA: ChildComponent<TA, A>, childB: ChildComponent<TB, B>, childC: ChildComponent<TC, C>, childD: ChildComponent<TD, D>, childE: ChildComponent<TE, E>, childF: ChildComponent<TF, F>, childG: ChildComponent<TG, G>, childH: ChildComponent<TH, H>): ComponentOperatorOld<T, EV, EV & A & B & C & D & E & F & G & H>
// export function children<T extends HTMLElement, EV, A = {}, TA extends Node = Node, B = {}, TB extends Node = Node, C = {}, TC extends Node = Node, D = {}, TD extends Node = Node, E = {}, TE extends Node = Node, F = {}, TF extends Node = Node, G = {}, TG extends Node = Node, H = {}, TH extends Node = Node, I = {}, TI extends Node = Node>(childA: ChildComponent<TA, A>, childB: ChildComponent<TB, B>, childC: ChildComponent<TC, C>, childD: ChildComponent<TD, D>, childE: ChildComponent<TE, E>, childF: ChildComponent<TF, F>, childG: ChildComponent<TG, G>, childH: ChildComponent<TH, H>, childI: ChildComponent<TI, I>): ComponentOperatorOld<T, EV, EV & A & B & C & D & E & F & G & H & I>
// // tslint:enable: max-line-length

// export function children<T extends HTMLElement, E>(
//   ...childComponents: ChildComponent<Node, any>[]
// ): ComponentOperatorOld<T, E, any> {
//   return (component: ComponentOld<T, E>) => component.pipe(
//     switchMap(({ node, events }) => {

//       const children$ = combineLatest<IComponent<Node, any>[][]>(
//         ...childComponents.map(coerceChildComponent) // Coerce all child nodes to be most generic type and combine.
//       ).pipe(
//         debounceTime(0), // Prevent repeated emission for simultaneous changes.
//         map(childrenOrNull => childrenOrNull.filter(child => child !== null)), // Remove empty children then flatten.
//         map(unflattened => unflattened.reduce<IComponent<Node, any>[]>((flat, comps) => flat.concat(comps), [])),
//         shareReplay(SHARE_REPLAY_CONFIG), // Share to prevent duplication of stream.
//       );

//       const events$ = children$.pipe( // Merge child events with component events.
//         map(components =>
//           merge<any>(
//             ...(events ? [events] : []),
//             ...components.map(comp => comp.events).filter(ev => ev !== undefined),
//           )
//         ),
//         switchAll(),
//         share(), // Remove in favour of sharing when used?
//       );

//       let previousNodes: Node[] = [];
//       return children$.pipe( // Add child updating to the stream and return component.
//         map(components => {
//           const nodes = components.map(comp => comp.node);
//           updateElementChildren(node, previousNodes, nodes); // Update the component child nodes.
//           previousNodes = nodes; // Store nodes for reference.
//           return node;
//         }),
//         distinctUntilChanged(),
//         mapTo({ node, events: events$ }), // Map to component type.
//         shareReplay(SHARE_REPLAY_CONFIG), // Is this share needed?
//       );
//     }),
//   );
// }
