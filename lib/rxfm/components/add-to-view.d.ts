import { ElementType, Component } from './component';
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
export declare function addToView(component: Component<ElementType, any>, host: ElementType): RemoveComponent;
/**
 * Add an RxFM Component to the document body.
 * @param component The component observable to add.
 * @returns A function to remove the component from the view.
 */
export declare function addToBody(component: Component<ElementType, any>): RemoveComponent;
/**
 * Add an RxFM Component to the document head.
 * @param component The component observable to add.
 * @returns A function to remove the component from the view.
 */
export declare function addToHead(component: Component<ElementType, any>): RemoveComponent;
