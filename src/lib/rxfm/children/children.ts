import { Observable, of, combineLatest } from 'rxjs';
import { map, switchMap, debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { childDiffer } from './child-differ';
import { ElementType, Component, ComponentOperator, ComponentObservable } from '../components';
import { EventType } from '../events';

export type NullLike = null | undefined | false;
export type StringLike = string | number;
/**
 * The possible types which can be added as a child component through the 'children' operator.
 */
export type ComponentLike<T extends ElementType, E extends EventType = never> = Component<T, E> | Component<T, E>[];

// TODO: Add option to pass component creation function if event types can be inferred.
export type ChildComponent<T extends ElementType = ElementType, E = EventType> =
  StringLike | NullLike | Observable<StringLike | NullLike | ComponentLike<T, E>>;

export type CoercedChildComponent = (ElementType | Text)[];

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
      distinctUntilChanged(),
      map(child => {
        if (child && typeof child !== 'string' && typeof child !== 'number') {
          // If child was already a component or component array, coerce to array of elements and return
          return Array.isArray(child) ? child.map(({ element }) => element) : [child.element];
        } else if (child !== undefined && child !== null && child !== false) { // Else if string like
          node = node || document.createTextNode(''); // If emission is text-like, create a text node or use existing.
          node.nodeValue = child.toString(); // Coerce to string and update text node value.
          return [node]; // Return component in an array.
        }
        return null // Otherwise return null to indicate empty.
      }),
    );
  } else if (childComponent !== undefined && childComponent !== null && childComponent !== false) { // If string like.
    const node = document.createTextNode(childComponent.toString()); // Coerce to string and create text node with string value.
    return of([node]); // Return observable component in an array.
  }
  return of(null); // Otherwise return null observable to indicate empty.
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

export type ArrayType<T extends any[]> = T extends (infer A)[] ? A extends EventType ? A : never : never;

export type ChildEvents<T extends ChildComponent<ElementType, EventType>[]> = ArrayType<{
  [P in keyof T]: T[P] extends Observable<ComponentLike<infer _, infer E>> ? E : never;
}>;

// /**
//  * An observable operator to add children to a component.
//  * @param childComponents A spread array of ChildComponent type to add to this component. These may take a number of
//  * forms, the simplest of which are strings, numbers or booleans or observables emitting any of these. Other components
//  * may also be passed (Observables emitting the IComponent interface). Finally Observables emitting IComponent arrays
//  * may be passed, this is used for adding dynamic arrays of components (see the 'generate' operator).
//  */
export function children<T extends ElementType, C extends ChildComponent<ElementType, EventType>[], E = never>(
  ...childComponents: C
): ComponentOperator<T, E, E | ChildEvents<C>> {
  return (component$: ComponentObservable<T, E>) => component$.pipe(
    switchMap(component => {
      let previousNodes: Node[] = [];
      return combineLatest<(CoercedChildComponent | null)[]>(
        ...childComponents.map(coerceChildComponent) // Coerce all child nodes to be most generic type and combine.
      ).pipe(
        debounceTime(0), // Prevent repeated emission for simultaneous changes.
        startWith([]),
        //  Remove empty children then flatten.
        map(childrenOrNull => childrenOrNull.filter(child => child !== null) as CoercedChildComponent[]),
        map(notFlat => notFlat.reduce<CoercedChildComponent>((flat, comps) => flat.concat(comps), [])),
        map(nodes => {
          updateElementChildren(component.element, previousNodes, nodes); // Update the component child nodes.
          previousNodes = nodes; // Store nodes for reference.
          return component;
        }),
        distinctUntilChanged(),
      );
    }),
  );
}
