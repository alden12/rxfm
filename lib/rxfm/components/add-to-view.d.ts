import { Component, ElementType } from "./component";
/**
 * A function to remove a component from the view.
 */
export declare type RemoveComponent = () => void;
/**
 * Add an RxFM Component into the view.
 * @param component The component observable to add.
 * @param host The host element to add to.
 * @returns A function to remove the component from the view.
 */
export declare function addToView(component: Component, host?: ElementType): RemoveComponent;
