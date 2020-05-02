import { Component, ElementType } from './component';
import { distinctUntilChanged } from 'rxjs/operators';

/**
 * A function to remove a component from the view.
 */
export type RemoveComponent = () => void;

/**
 * Add an RxFM Component into the view.
 * @param component The component to add or a function emitting a component.
 * @param host The host element to add to.
 * @param eventHandler An optional function to handle events emitted by the component.
 * @returns A function to remove the component from the view.
 */
export function addToView<E = {}>(
  component: Component<ElementType, E> | (() => Component<ElementType, E>),
  host: ElementType,
): RemoveComponent {
  let oldNode: Node; // The node already in the view, if it exists.
  const subscription = (typeof component === 'function' ? component() : component).pipe(
    distinctUntilChanged(),
  ).subscribe(node => {
    if (oldNode) { // Add node to host or replace existing node.
      host.replaceChild(node, oldNode);
    } else {
      host.appendChild(node);
    }
    oldNode = node;
  });

  return () => { // Return a function to remove the node and clean up subscription.
    subscription.unsubscribe();
    host.removeChild(oldNode);
  }
}

/**
 * Add an RxFM Component to the document body.
 * @param component The component to add or a function emitting a component.
 * @param eventHandler An optional function to handle events emitted by the component.
 * @returns A function to remove the component from the view.
 */
export function addToBody<E = {}>(
  component: Component<ElementType, E> | (() => Component<ElementType, E>),
): RemoveComponent {
  return addToView(component, document.body);
}

// /**
//  * A function to remove a component from the view.
//  */
// export type Remove = () => void;

// /**
//  * Add an RxFM Component into the view.
//  * @param component The component to add or a function emitting a component.
//  * @param host The host element to add to.
//  * @param eventHandler An optional function to handle events emitted by the component.
//  * @returns A function to remove the component from the view.
//  */
// export function addToView<E = {}>(
//   component: ComponentOld<Node, E> | (() => ComponentOld<Node, E>),
//   host: HTMLElement,
//   eventHandler?: (event: E) => void,
// ): Remove {
//   let oldNode: Node; // The node already in the view, if it exists.
//   const subscription = (typeof component === 'function' ? component() : component).pipe(
//     switchMap(({ node, events }) => events.pipe(
//       tap(event => typeof eventHandler === 'function' && eventHandler(event)), // Handle events if handler provided.
//       map(() => node),
//       startWith(node),
//     )),
//     distinctUntilChanged(),
//   ).subscribe(node => {
//     if (oldNode) { // Add node to host or replace existing node.
//       host.replaceChild(node, oldNode);
//     } else {
//       host.appendChild(node);
//     }
//     oldNode = node;
//   });

//   return () => { // Return a function to remove the node and clean up subscription.
//     subscription.unsubscribe();
//     host.removeChild(oldNode);
//   }
// }

// /**
//  * Add an RxFM Component to the document body.
//  * @param component The component to add or a function emitting a component.
//  * @param eventHandler An optional function to handle events emitted by the component.
//  * @returns A function to remove the component from the view.
//  */
// export function addToBody<E = {}>(
//   component: ComponentOld<Node, E> | (() => ComponentOld<Node, E>),
//   eventHandler?: (event: E) => void,
// ): Remove {
//   return addToView(component, document.body, eventHandler);
// }
