import { MonoTypeOperatorFunction, Observable } from "rxjs";
import { switchMap, startWith, mapTo, distinctUntilChanged } from "rxjs/operators";
import { ChildComponent } from "../children/children";

export type ElementType = HTMLElement | SVGElement;

export type Component<T extends ElementType = ElementType> = Observable<T>;

export type ComponentFunction<T extends ElementType = ElementType> =
  (...childComponents: ChildComponent[]) => Component<T>;

export type ComponentOperator<T extends ElementType> = MonoTypeOperatorFunction<T>;

/**
 * A function to create a component operator.
 * @param effect Must emit immediately if order sensitive.
 */
export function componentOperator<T extends ElementType, U>(
  effect: (element: T) => Observable<U>,
): ComponentOperator<T> {
  return (component: Component<T>) => component.pipe(
    distinctUntilChanged(),
    switchMap(element => effect(element).pipe(
      mapTo(element),
      startWith(element),
    )),
    distinctUntilChanged(),
  );
}
