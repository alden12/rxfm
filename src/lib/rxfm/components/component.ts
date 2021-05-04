import { defer, MonoTypeOperatorFunction, Observable, of } from "rxjs";
import { switchMap, startWith, distinctUntilChanged, tap, ignoreElements } from "rxjs/operators";
import { children, ComponentChild } from "../children/children";
import { flatten } from "../utils";

export type ElementType = HTMLElement | SVGElement;

export type Component<T extends ElementType = ElementType> = Observable<T>;

export type ComponentFunction<T extends ElementType> = (...childComponents: ComponentChild[]) => Component<T>;

export type ComponentCreator<T extends ElementType = ElementType> = {
  (...childComponents: ComponentChild[]): Component<T>;
  (templateStrings: TemplateStringsArray, ...componentChildren: ComponentChild[]): Component<T>;
};

export type ComponentOperator<T extends ElementType> = MonoTypeOperatorFunction<T>;

export function componentFunction<T extends ElementType>(createElement: () => T): ComponentFunction<T> {
  return (...childComponents: ComponentChild[]) => defer(() => of(createElement())).pipe(
    children(...childComponents),
  );
}

export function componentCreator<T extends ElementType>(componentFunction: ComponentFunction<T>): ComponentCreator<T> {
  return (stringsOrFirstChild: TemplateStringsArray | ComponentChild, ...componentChildren: ComponentChild[]) => {
    if (Array.isArray(stringsOrFirstChild)) {
      if (stringsOrFirstChild.every(val => typeof val === 'string')) {
        return componentFunction(
          ...flatten((stringsOrFirstChild as TemplateStringsArray)
            .map((str, i) => [str, componentChildren[i] ? componentChildren[i] : null]),
          ),
        );
      }
      throw new TypeError('Arrays may only be passed as component children when using the tagged templates form eg: "div`hello world`".');
    }
    return componentFunction(stringsOrFirstChild as ComponentChild, ...componentChildren);
  };
}

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
      ignoreElements(),
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
