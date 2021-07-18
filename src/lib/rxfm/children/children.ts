import { combineLatest, Observable, of, OperatorFunction } from 'rxjs';
import { distinctUntilChanged, finalize, ignoreElements, map, startWith, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Component, componentOperator, ComponentOperator, ElementType } from '../components/component';
import { addChildrenToMetadata, removeChildrenFromMetadata, registerChildrenBlockMetadata } from './children-operator-isolation';
import { StringLike, NullLike, flatten, coerceToArray, coerceToObservable } from '../utils';
import { childDiffer } from './child-differ';
import { operatorIsolationService } from '../operator-isolation-service';

export interface AppendElement<T = ElementType> {
  element: T;
  insertBefore: T | null;
}

export interface ElementDiff<T = ElementType> {
  append: AppendElement<T>[];
  remove: T[];
  first: T | null;
}

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
    | ElementDiff
  >
  | (() => Component);

/**
 * The possible types which may be used as a child element.
 */
type ChildElement = ElementType | Text;

// type CoercedChildComponent = ChildElement[];

// /**
//  * Coerce any of the members of the ChildComponent type to be the most generic child component type.
//  */
// function coerceChildComponent(childComponent: ComponentChild): Observable<CoercedChildComponent | null> {
//   if (childComponent instanceof Observable || typeof childComponent === 'function') { // If observable or function returning one.
//     let node: Text; // Create outer reference to text node if it is needed.
//     return (typeof childComponent === 'function' ? childComponent() : childComponent).pipe( // Create observable if applicable.
//       startWith(null),
//       distinctUntilChanged(),
//       map(child => {
//         if (child && typeof child !== 'string' && typeof child !== 'number') {
//           // If child was already a component or component array, coerce to array of elements and return
//           return coerceToArray(child);
//         } else if (child !== undefined && child !== null && child !== false) { // Else if string like
//           node = node || document.createTextNode(''); // If emission is text-like, create a text node or use existing.
//           node.nodeValue = child.toString(); // Coerce to string and update text node value.
//           return [node]; // Return component in an array.
//         }
//         return null; // Otherwise return null to indicate empty.
//       }),
//     );
//   } else if (childComponent !== undefined && childComponent !== null && childComponent !== false) { // If string like.
//     const node = document.createTextNode(childComponent.toString()); // Coerce to string and create text node with string value.
//     return of([node]); // Return observable component in an array.
//   }
//   return of(null); // Otherwise return null observable to indicate empty.
// }

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

// /**
//  * A component operator to add children to either the start or the end of a component.
//  * @param childComponents The children to add.
//  * @param end Whether the children should be start or end aligned. These will be placed after any existing start aligned children
//  * or before any existing end aligned children.
//  */
// function startOrEndChildren<T extends ElementType>(childComponents: ComponentChild[], end: boolean): ComponentOperator<T> {
//   return componentOperator(element => {
//     let previousElements: ChildElement[] = [];
//     const symbol = Symbol('Children Operator');

//     // Coerce all child nodes to be most generic type and combine.
//     return combineLatest(childComponents.map(coerceChildComponent)).pipe(
//       startWith([] as (CoercedChildComponent | null)[]),
//       //  Remove empty children then flatten.
//       map(childrenOrNull => flatten(childrenOrNull.filter(child => child !== null) as CoercedChildComponent[])),
//       tap(elements => {
//         updateElementChildren(element, previousElements, elements, symbol, end); // Update the element child nodes.
//         previousElements = elements; // Store nodes for reference.
//       }),
//     );
//   });
// }

type ChildElementDiff = ElementDiff<ChildElement>;

type ElementInput = ChildElement | ChildElementDiff | NullLike;

function isChildElement(elementInput: ElementInput): elementInput is ChildElement {
  return (elementInput instanceof Element || elementInput instanceof Text);
}

const throwElementDiffError = (operation: string) => {
  throw new Error(`An element diff in a children operator attempted to ${operation} a child element which it does not manage.`);
};

const updateElementSet = ({ append, remove, first }: ChildElementDiff, elementSet: Set<ChildElement>) => {
  // Delete all removed elements from the set, if any were not present, throw error.
  remove.forEach(element => !elementSet.delete(element) && throwElementDiffError('remove'));
  append.forEach(({ element }) => elementSet.add(element));
  if (first && !elementSet.has(first)) throwElementDiffError('use');
};

function coerceToDiff(
  currentElementInput: ElementInput,
  previousElementInput: ElementInput,
  elementSet?: Set<ChildElement>,
): { childElementDiff: ChildElementDiff, newElementSet?: Set<ChildElement> } {
  if (!currentElementInput) {
    // If current and previous element inputs were both null-like, return empty diff.
    if (!previousElementInput) return { childElementDiff: { append: [], remove: [], first: null } };
    // If element has been removed, remove previous element or all elements in element set.
    const remove = isChildElement(previousElementInput) ? [previousElementInput] : elementSet ? [...elementSet] : [];
    return { childElementDiff: { append: [], remove, first: null } };
  }

  if (isChildElement(currentElementInput)) {
    const append = [{ element: currentElementInput, insertBefore: null }];
    if (isChildElement(previousElementInput)) {
      // If element changes, remove the old and append the new element.
      return { childElementDiff: { append, remove: [previousElementInput], first: currentElementInput } };
    } else {
      // If element input has changed from a diff to a single element, remove elements from element set and append new element.
      return { childElementDiff: { append, remove: elementSet ? [...elementSet] : [], first: currentElementInput } };
    }
  } else { // Current element input is element diff:
    const newElementSet = elementSet || new Set<ChildElement>();
    updateElementSet(currentElementInput, newElementSet);
    // Set the insert before element for any appended elements to the overall insert before element if not defined.
    if (!isChildElement(previousElementInput)) {
      // If current and previous were both element diffs, update element set with new elements and return current element diff.
      return { childElementDiff: currentElementInput, newElementSet };
    } else {
      // If element input has changed from a single element to an element diff, add previous element to current element diff's removed,
      // update element set, and return current element diff.
      const childElementDiff = { ...currentElementInput, remove: [...currentElementInput.remove, previousElementInput] };
      return { childElementDiff, newElementSet };
    }
  }
}

function coerceToElementDiff(
  componentChild: ComponentChild,
): Observable<ChildElementDiff | null> {
  if (componentChild instanceof Observable || typeof componentChild === 'function') { // If observable or function returning one.
    let previousElementInput: ElementInput = null;
    let elementSet: Set<ChildElement> | undefined = undefined;
    let textNode: Text; // Create outer reference to text node if it is needed.
    return (typeof componentChild === 'function' ? componentChild() : componentChild).pipe( // Create observable if applicable.
      startWith(null),
      distinctUntilChanged(),
      map(child => {
        if (child && typeof child !== 'string' && typeof child !== 'number') {
          // If child was already a component or component diff, coerce to component diff and return
          const { childElementDiff, newElementSet } = coerceToDiff(child, previousElementInput, elementSet);
          previousElementInput = child;
          elementSet = newElementSet;
          return childElementDiff;
        } else if (child !== undefined && child !== null && child !== false) { // Else if string like
          textNode = textNode || document.createTextNode(''); // If emission is text-like, create a text node or use existing.
          textNode.nodeValue = child.toString(); // Coerce to string and update text node value.
          const { childElementDiff, newElementSet } = coerceToDiff(textNode, previousElementInput, elementSet);
          previousElementInput = textNode;
          elementSet = newElementSet;
          return childElementDiff;
        }
        // TODO: remove previous child element.
        const { childElementDiff, newElementSet } = coerceToDiff(null, previousElementInput, elementSet);
        previousElementInput = null;
        elementSet = newElementSet;
        return childElementDiff;
      }),
    );
  } else if (componentChild !== undefined && componentChild !== null && componentChild !== false) { // If string like.
    const textNode = document.createTextNode(componentChild.toString()); // Coerce to string and create text node with string value.
    return of(coerceToDiff(textNode, null).childElementDiff); // Return as observable element diff.
  }
  return of(null); // Otherwise return null observable to indicate empty.
}

function addComponentChild<T extends ElementType>(
  element: T,
  insertBefore: Observable<ChildElement | null>,
  componentChild: ComponentChild,
): Observable<ChildElement | null> {
  let previousElementDiff: ChildElementDiff | null = null;

  return combineLatest([
    coerceToElementDiff(componentChild),
    insertBefore,
  ]).pipe(
    map(([currentElementDiff, insertBeforeElement]) => {
      if (currentElementDiff && currentElementDiff !== previousElementDiff) {
        currentElementDiff.remove.forEach(child => element.removeChild(child));
        currentElementDiff.append.forEach(child => element.insertBefore(child.element, child.insertBefore || insertBeforeElement));
      }
      previousElementDiff = currentElementDiff;
      return currentElementDiff?.first || insertBeforeElement;
    }),
    distinctUntilChanged(),
  );
}

export function children<T extends ElementType>(...childComponents: ComponentChild[]): ComponentOperator<T> {
  return componentOperator(element => childComponents.reduceRight<Observable<ChildElement | null>>(
    (insertBefore, componentChild) => addComponentChild(element, insertBefore, componentChild),
    of(null),
  ));
}

// /**
//  * A component operator to add children to a component. If other instances of the children operator exist on a given component,
//  * children will be added after those of the previous operators.
//  * @param childComponents A spread array of ChildComponent type to add to this component. These may take a number of
//  * forms, the simplest of which are strings, numbers, booleans, or observables emitting any of these. Other components
//  * may also be passed. Finally Observables emitting component arrays may be passed, this is used for adding dynamic
//  * arrays of components (see the 'mapToComponents' operator).
//  */
// export function children_<T extends ElementType>(...childComponents: ComponentChild[]): ComponentOperator<T> {
//   return startOrEndChildren(childComponents, false);
// }

// /**
//  * A component operator to add children to the end of a component, after those added by the children operator.
//  * If other instances of the lastChildren operator exist on a given component, children will be added before those of the previous
//  * operators.
//  * @param childComponents A spread array of ChildComponent type to add to this component. These may take a number of
//  * forms, the simplest of which are strings, numbers, booleans, or observables emitting any of these. Other components
//  * may also be passed. Finally Observables emitting component arrays may be passed, this is used for adding dynamic
//  * arrays of components (see the 'mapToComponents' operator).
//  */
// export function lastChildren<T extends ElementType>(...childComponents: ComponentChild[]): ComponentOperator<T> {
//   return startOrEndChildren(childComponents, true);
// }
