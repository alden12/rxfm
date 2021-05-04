import { MonoTypeOperatorFunction, Observable } from "rxjs";
import { ComponentChild } from "../children/children";
export declare type ElementType = HTMLElement | SVGElement;
export declare type Component<T extends ElementType = ElementType> = Observable<T>;
export declare type ComponentFunction<T extends ElementType> = (...childComponents: ComponentChild[]) => Component<T>;
export declare type ComponentCreator<T extends ElementType = ElementType> = {
    (...childComponents: ComponentChild[]): Component<T>;
    (templateStrings: TemplateStringsArray, ...componentChildren: ComponentChild[]): Component<T>;
};
export declare type ComponentOperator<T extends ElementType> = MonoTypeOperatorFunction<T>;
export declare function componentFunction<T extends ElementType>(createElement: () => T): ComponentFunction<T>;
export declare function componentCreator<T extends ElementType>(componentFunction: ComponentFunction<T>): ComponentCreator<T>;
/**
 * A function to create a component operator.
 * @param effect Must emit immediately if order sensitive.
 */
export declare function componentOperator<T extends ElementType, U>(effect: (element: T) => Observable<U>): ComponentOperator<T>;
/**
 * Add an observable into the component stream.
 * @param observable The observable to add into the component stream.
 * @param effect An optional effect to execute when the observable emits, this is equivalent to using 'tap' on the observable.
 * @returns A component operator function.
 */
export declare function sideEffect<T extends ElementType, U, V>(observable: Observable<U>, effect?: (value: U) => V): ComponentOperator<T>;
