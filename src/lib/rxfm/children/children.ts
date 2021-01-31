// import { Observable, of, combineLatest } from 'rxjs';
// import { map, switchMap, debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
// import { childDiffer } from './child-differ';
// import { ElementType, RxFMElement, ComponentOperator, Component } from '../components';
// import { EventType } from '../events';
import { combineLatest, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, tap } from 'rxjs/operators';
import { componentOperator, ComponentOperator, ElementType } from '../components';
import { childrenModifierService } from './children-modifier-service';
import { StringLike, NullLike, flatten, coerceToArray } from '../utils';
import { childDiffer } from './child-differ';

export type ChildComponent = StringLike | NullLike | Observable<StringLike | NullLike | ElementType | ElementType[]>;

export type ChildElement = ElementType | Text;

export type CoercedChildComponent = ChildElement[];

/**
 * Coerce any of the members of the ChildComponent type to be the most generic child component type.
 */
function coerceChildComponent(childComponent: ChildComponent): Observable<CoercedChildComponent | null> {
  if (childComponent instanceof Observable) { // If observable.
    let node: Text; // Create outer reference to text node if it is needed.
    return childComponent.pipe(
      startWith(null),
      distinctUntilChanged(),
      map(child => {
        if (child && typeof child !== 'string' && typeof child !== 'number') {
          // If child was already a component or component array, coerce to array of elements and return
          return coerceToArray(child);
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
  element: T,
  previousChildren: ChildElement[],
  newChildren: ChildElement[],
  symbol: symbol,
  end: boolean,
): T {
  const diff = childDiffer(previousChildren, newChildren); // Get the difference between the new and old state.

  diff.removed.forEach(node => childrenModifierService.removeChild(element, symbol, node)); // Remove all deleted nodes.

  childrenModifierService.setChildren( // Append any nodes to the element which should appear after existing nodes.
    element,
    symbol,
    diff.updated.filter(update => !update.insertBefore).map(update => update.node),
    end,
  );

  diff.updated // Add any nodes which should go in between existing nodes.
    .filter(update => update.insertBefore)
    .forEach(update => childrenModifierService.setChildren(element, symbol, update.node, end, update.insertBefore));

  return element;
}

// export type ArrayType<T extends any[]> = T extends (infer A)[] ? A extends EventType ? A : never : never;

// export type ChildEvents<T extends ChildComponent<ElementType, EventType>[]> = ArrayType<{
//   [P in keyof T]: T[P] extends Observable<ComponentLike<infer _, infer E>> ? E : never;
// }>;

function firstOrLastChildren<T extends ElementType>(childComponents: ChildComponent[], end: boolean): ComponentOperator<T> {
  return componentOperator(element => {
    let previousElements: ChildElement[] = [];
    const symbol = Symbol('Children Operator');

    // Coerce all child nodes to be most generic type and combine.
    return combineLatest(childComponents.map(coerceChildComponent)).pipe(
      debounceTime(0), // Prevent repeated emission for simultaneous changes.
      startWith([] as (CoercedChildComponent | null)[]),
      //  Remove empty children then flatten.
      map(childrenOrNull => flatten(childrenOrNull.filter(child => child !== null) as CoercedChildComponent[])),
      tap(elements => {
        updateElementChildren(element, previousElements, elements, symbol, end); // Update the element child nodes.
        previousElements = elements; // Store nodes for reference.
      }),
    );
  });
}

// /**
//  * An observable operator to add children to a component.
//  * @param childComponents A spread array of ChildComponent type to add to this component. These may take a number of
//  * forms, the simplest of which are strings, numbers or booleans or observables emitting any of these. Other components
//  * may also be passed (Observables emitting the IComponent interface). Finally Observables emitting IComponent arrays
//  * may be passed, this is used for adding dynamic arrays of components (see the 'generate' operator).
//  */
export function children<T extends ElementType>(...childComponents: ChildComponent[]): ComponentOperator<T> {
  return firstOrLastChildren(childComponents, false);
}

export function lastChildren<T extends ElementType>(...childComponents: ChildComponent[]): ComponentOperator<T> {
  return firstOrLastChildren(childComponents, true);
}
