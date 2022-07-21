import { distinctUntilChanged } from "rxjs/operators";
import { NullLike } from "../utils";
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
  let oldNode: ElementType | NullLike; // The node already in the view, if it exists.
  const subscription = component.pipe(
    distinctUntilChanged(),
  ).subscribe(element => {
    if (!element && oldNode) { // If removing the node.
      host.removeChild(oldNode);
    } else if (oldNode && element) { // If replacing existing node.
      host.replaceChild(element, oldNode);
    } else if (element) { // If adding the node.
      host.appendChild(element);
    }
    oldNode = element;
  });

  return () => { // Return a function to remove the node and clean up subscription.
    subscription.unsubscribe();
    oldNode && host.removeChild(oldNode);
  };
}
