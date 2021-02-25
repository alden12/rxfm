import { Observable } from "rxjs";
import { distinctUntilChanged, map, startWith, tap } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "../components";
import { elementMetadataService } from "../metadata-service";
import { coerceToObservable, NullLike } from "../utils";

// TODO: Find a better way to exclude, perhaps { [K in keyof T as T[K] extends string ? K : never]: T[K] } in TS4.1
export type StyleKeys = Exclude<
  Extract<keyof CSSStyleDeclaration, string>,
  'getPropertyPriority' | 'getPropertyValue' | 'item' | 'removeProperty' | 'setProperty' | 'parentRule' | 'length'
>;

export type StyleType = string | NullLike;

export type Style = StyleType | Observable<StyleType>

export type StyleObject = Partial<Record<StyleKeys, StyleType>>;

export function style<T extends ElementType, K extends StyleKeys>(
  name: K,
  value: Style,
  externalSymbol?: symbol,
): ComponentOperator<T> {
  return componentOperator(element => {
    const symbol = externalSymbol || Symbol('Style Operator');

    return coerceToObservable(value).pipe(
      map(val => val || null),
      startWith(undefined),
      distinctUntilChanged(),
      tap(val => {
        elementMetadataService.setStyles(element, symbol, { [name]: val });
        const primaryValue = elementMetadataService.getStyle(element, name);
        if (primaryValue !== undefined && element.style[name] !== primaryValue) {
          element.style[name] = primaryValue as string;
        }
      }),
    );
  });
}

export type Styles = {
  [K in StyleKeys]?: Style;
};

export type StaticStyles = {
  [K in StyleKeys]?: StyleType;
};

// /**
//  * An observable operator to update the styles on an RxFM component.
//  * @param stylesOrObservableStyles A dictionary (or observable emitting a dictionary) of style names to values.
//  */
export function styles<T extends ElementType>(
  stylesDict: Styles | Observable<StaticStyles>,
): ComponentOperator<T> {
  if (stylesDict instanceof Observable) {
    return componentOperator(element => {
      const symbol = Symbol('Styles Operator');
      let previousStyles: StaticStyles = {};

      return stylesDict.pipe(
        startWith({} as StaticStyles),
        tap(dict => {
          const previousStylesNullValues = Object.keys(previousStyles).reduce((nullValues, key) => {
            nullValues[key] = null;
            return nullValues;
          }, {} as Partial<Record<StyleKeys, null>>);
          const newStyles = { ...previousStylesNullValues, ...dict };

          previousStyles = dict;
          elementMetadataService.setStyles(element, symbol, newStyles);

          Object.keys(newStyles).forEach((key: StyleKeys) => {
            const primaryValue = elementMetadataService.getStyle(element, key);
            if (element.style[key] !== (primaryValue || '')) {
              element.style[key] = (primaryValue || null) as string;
            }
          });
        }),
      );
    });
  } else {

    return (input: Component<T>) => {
      const symbol = Symbol('Styles Operator');
      return Object.keys(stylesDict).reduce((component, key: StyleKeys) => component.pipe(
        style(key, stylesDict[key], symbol),
      ), input);
    }
  }
}
