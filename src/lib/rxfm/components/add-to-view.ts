// import { ElementType, Component } from './component';
// import { distinctUntilChanged } from 'rxjs/operators';

import { distinctUntilChanged } from "rxjs/operators";
import { Component, ElementType } from "./component";

/**
 * A function to remove a component from the view.
 */
export type RemoveComponent = () => void;

/**
 * Add an RxFM Component into the view.
 * @param component The component observable to add.
 * @param host The host element to add to.
 * @returns A function to remove the component from the view.
 */
export function addToView(
  component: Component,
  host: ElementType = document.body,
): RemoveComponent {
  let oldNode: ElementType; // The node already in the view, if it exists.
  const subscription = component.pipe(
    distinctUntilChanged(),
  ).subscribe(element => {
    if (oldNode) { // Add node to host or replace existing node.
      host.replaceChild(element, oldNode);
    } else {
      host.appendChild(element);
    }
    oldNode = element;
  });

  return () => { // Return a function to remove the node and clean up subscription.
    subscription.unsubscribe();
    host.removeChild(oldNode);
  }
}

// /**
//  * Add an RxFM Component to the document body.
//  * @param component The component observable to add.
//  * @returns A function to remove the component from the view.
//  */
// export function addToBody(
//   component: Component<ElementType, any>,
// ): RemoveComponent {
//   return addToView(component, document.body);
// }

// /**
//  * Add an RxFM Component to the document head.
//  * @param component The component observable to add.
//  * @returns A function to remove the component from the view.
//  */
// export function addToHead(
//   component: Component<ElementType, any>,
// ): RemoveComponent {
//   return addToView(component, document.head);
// }