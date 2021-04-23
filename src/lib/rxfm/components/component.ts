import { MonoTypeOperatorFunction, Observable } from "rxjs";
import { switchMap, startWith, mapTo, distinctUntilChanged, tap } from "rxjs/operators";
import { ComponentChild } from "../children/children";

export type ElementType = HTMLElement | SVGElement;

export type Component<T extends ElementType = ElementType> = Observable<T>;

export type ComponentFunction<T extends ElementType = ElementType> =
  (...childComponents: ComponentChild[]) => Component<T>;

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

/**
 * Add an observable into the component stream.
 * @param observable The observable to add into the component stream.
 * @param effect An optional effect to execute when the observable emits, this is equivalent to using 'tap' on the observable.
 * @returns A component operator function.
 */
export function sideEffect<T extends ElementType, U, V>(
  observable: Observable<U>,
  effect?: (value: U) => V,
): ComponentOperator<T> {
  if (effect) {
    return componentOperator(() => observable.pipe(tap(effect)));
  }
  return componentOperator(() => observable);
}
