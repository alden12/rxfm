import { MonoTypeOperatorFunction, Observable } from "rxjs";
import { switchMap, startWith, mapTo, distinctUntilChanged } from "rxjs/operators";
import { ChildComponent } from "../children/children";

/**
 * The possible DOM element types which can be used in RxFM. These are HTML and SVG elements.
 */
export type ElementType = HTMLElement | SVGElement;

/**
 * An observable emitting a DOM element. This is the fundamental type in RxFM.
 */
export type Component<T extends ElementType = ElementType> = Observable<T>;

/**
 * A function taking any number of component children and returning a component.
 */
export type ComponentFunction<T extends ElementType = ElementType> =
  (...childComponents: ChildComponent[]) => Component<T>;

/**
 * An RxJS operator function which can be used for performing actions on RxFM components.
 * The operator may be used in the pipe method of a component and will not change the resulting component type.
 */
export type ComponentOperator<T extends ElementType> = MonoTypeOperatorFunction<T>;

/**
 * A function to create a ComponentOperator function.
 * @param effect A function taking the element represented by the input component and returning an observable of any type.
 * The returned observable must emit immediately if it's action is order sensitive (ie. if two instances of the same operator
 * on a component must perform their action in the same order each time).
 * NOTE: component operators are executed in reverse order on a component (last operator is handled first).
 * @returns A component operator function taking a component and returning the same component.
 */
export function componentOperator<T extends ElementType, U>(
  effect: (element: T) => Observable<U>,
): ComponentOperator<T> {
  return (component: Component<T>) => component.pipe(
    distinctUntilChanged(),
    switchMap(element => effect(element).pipe( // Add the effect observable into the stream.
      mapTo(element), // Return the original element as a single emission as if nothing happened.
      startWith(element),
    )),
    distinctUntilChanged(),
  );
}
