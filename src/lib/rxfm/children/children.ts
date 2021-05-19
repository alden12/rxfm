import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, map, startWith, tap } from 'rxjs/operators';
import { componentOperator, ComponentOperator, ElementType } from '../components/component';
import { addChildrenToMetadata, removeChildrenFromMetadata, registerChildrenBlockMetadata } from './children-operator-isolation';
import { StringLike, NullLike, flatten, coerceToArray } from '../utils';
import { childDiffer } from './child-differ';
import { operatorIsolationService } from '../operator-isolation-service';

/**
 * The possible types which may be passed as a component child.
 */
export type ComponentChild =
  | StringLike
  | NullLike
  | Observable<
    | StringLike
    | NullLike
    | ElementType
    | ElementType[]
  >
  | (() => Observable<ElementType>);

/**
 * The possible types which may be used as a child element.
 */
export type ChildElement = ElementType | Text;

type CoercedChildComponent = ChildElement[];

/**
 * Coerce any of the members of the ChildComponent type to be the most generic child component type.
 */
function coerceChildComponent(childComponent: ComponentChild): Observable<CoercedChildComponent | null> {
  if (childComponent instanceof Observable || typeof childComponent === 'function') { // If observable or function returning one.
    let node: Text; // Create outer reference to text node if it is needed.
    return (typeof childComponent === 'function' ? childComponent() : childComponent).pipe( // Create observable if applicable.
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
  blockSymbol: symbol,
  end: boolean,
): T {
  const { updated, removed } = childDiffer(previousChildren, newChildren); // Get the difference between the new and old state.

  const currentChildrenMetadata = operatorIsolationService.getChildrenMetadata(element); // Get current metadata.
  let newChildrenMetadata = registerChildrenBlockMetadata(currentChildrenMetadata, blockSymbol, end); // Add block if not present.

  removed.forEach(node => element.removeChild(node)); // Remove all deleted nodes.
  newChildrenMetadata = removeChildrenFromMetadata( // Remove deleted nodes from metadata.
    newChildrenMetadata,
    blockSymbol,
    removed.length,
  );

  newChildrenMetadata = updated.reduce((metadata, update) => {
    // Add child to metadata and find index to insert it before in the parent elements child nodes.
    const { newMetadata, insertBeforeIndex } = addChildrenToMetadata(metadata, blockSymbol, end);
    const insertBefore = update.insertBefore || element.childNodes[insertBeforeIndex]; // Find node to insert before.
    if (insertBefore) { // If insert before node found, add before this.
      element.insertBefore(update.node, insertBefore);
    } else { // Otherwise add to the end.
      element.appendChild(update.node);
    }
    return newMetadata;
  }, newChildrenMetadata);

  operatorIsolationService.setChildrenMetadata(element, newChildrenMetadata); // Set updated metadata.

  return element;
}

/**
 * A component operator to add children to either the start or the end of a component.
 * @param childComponents The children to add.
 * @param end Whether the children should be start or end aligned. These will be placed after any existing start aligned children
 * or before any existing end aligned children.
 */
function startOrEndChildren<T extends ElementType>(childComponents: ComponentChild[], end: boolean): ComponentOperator<T> {
  return componentOperator(element => {
    let previousElements: ChildElement[] = [];
    const symbol = Symbol('Children Operator');

    // Coerce all child nodes to be most generic type and combine.
    return combineLatest(childComponents.map(coerceChildComponent)).pipe(
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

/**
 * A component operator to add children to a component. If other instances of the children operator exist on a given component,
 * children will be added after those of the previous operators.
 * @param childComponents A spread array of ChildComponent type to add to this component. These may take a number of
 * forms, the simplest of which are strings, numbers, booleans, or observables emitting any of these. Other components
 * may also be passed. Finally Observables emitting component arrays may be passed, this is used for adding dynamic
 * arrays of components (see the 'mapToComponents' operator).
 */
export function children<T extends ElementType>(...childComponents: ComponentChild[]): ComponentOperator<T> {
  return startOrEndChildren(childComponents, false);
}

/**
 * A component operator to add children to the end of a component, after those added by the children operator.
 * If other instances of the lastChildren operator exist on a given component, children will be added before those of the previous
 * operators.
 * @param childComponents A spread array of ChildComponent type to add to this component. These may take a number of
 * forms, the simplest of which are strings, numbers, booleans, or observables emitting any of these. Other components
 * may also be passed. Finally Observables emitting component arrays may be passed, this is used for adding dynamic
 * arrays of components (see the 'mapToComponents' operator).
 */
export function lastChildren<T extends ElementType>(...childComponents: ComponentChild[]): ComponentOperator<T> {
  return startOrEndChildren(childComponents, true);
}
