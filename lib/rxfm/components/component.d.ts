import { MonoTypeOperatorFunction, Observable } from "rxjs";
import { ComponentChild } from "../children/children";
/**
 * The possible DOM element types which can be used in RxFM. These are HTML and SVG elements.
 */
export declare type ElementType = HTMLElement | SVGElement;
/**
 * An observable emitting a DOM element. This is the fundamental type in RxFM.
 */
export declare type Component<T extends ElementType = ElementType> = Observable<T>;
/**
 * A function taking any number of component children and returning a component.
 */
export declare type ComponentFunction<T extends ElementType> = (...childComponents: ComponentChild[]) => Component<T>;
/**
 * A function taking any number of component children, or children as a tagged template, and return a component.
 */
export declare type ComponentCreator<T extends ElementType = ElementType> = {
    (...childComponents: ComponentChild[]): Component<T>;
    (templateStrings: TemplateStringsArray, ...componentChildren: ComponentChild[]): Component<T>;
};
/**
 * An RxJS operator function which can be used for performing actions on RxFM components.
 * The operator may be used in the pipe method of a component and will not change the resulting component type.
 */
export declare type ComponentOperator<T extends ElementType> = MonoTypeOperatorFunction<T>;
/**
 * A function to make a component function from an element function.
 * @param createElement A function returning an element of type T.
 * @returns A component function, taking component children and returning a component observable of type T.
 */
export declare function componentFunction<T extends ElementType>(createElement: () => T): ComponentFunction<T>;
/**
 * A function taking a component function and giving it the ability to be used with the tagged template syntax.
 * @param componentFunction A component function of type T taking component children and returning a component observable.
 * @returns A component creator of type T, which may act the same as the provided component
 * function or may be used with the tagged template syntax.
 */
export declare function componentCreator<T extends ElementType>(componentFunction: ComponentFunction<T>): ComponentCreator<T>;
/**
 * A function to create a ComponentOperator function.
 * @param effect A function taking the element represented by the input component and returning an observable of any type.
 * The returned observable must emit immediately if it's action is order sensitive (ie. if two instances of the same operator
 * on a component must perform their action in the same order each time).
 * NOTE: component operators are executed in reverse order on a component (last operator is handled first).
 * @returns A component operator function taking a component and returning the same component.
 */
export declare function componentOperator<T extends ElementType, U>(effect: (element: T) => Observable<U>): ComponentOperator<T>;
/**
 * Add an observable into the component stream.
 * @param observable The observable to add into the component stream.
 * @param effect An optional effect to execute when the observable emits, this is equivalent to using 'tap' on the observable.
 * @returns A component operator function.
 */
export declare function sideEffect<T extends ElementType, U, V>(observable: Observable<U>, effect?: (value: U) => V): ComponentOperator<T>;
