import { Observable } from "rxjs";
import { distinctUntilChanged, map, startWith, tap } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "../components";
import { elementMetadataService } from "../metadata-service";
import { coerceToObservable, NullLike } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject, setAttributes } from "./attribute-metadata";

// TODO: Find a better way to exclude, perhaps { [K in keyof T as T[K] extends string ? K : never]: T[K] } in TS4.1
export type StyleKeys = Exclude<
  Extract<keyof CSSStyleDeclaration, string>,
  'getPropertyPriority' | 'getPropertyValue' | 'item' | 'removeProperty' | 'setProperty' | 'parentRule' | 'length'
>;

export type StyleType = string | NullLike;

export type Style = StyleType | Observable<StyleType>

export type StyleDictionary = AttributeMetadataDictionary<StyleKeys>;

export type StyleObject = AttributeMetadataObject<StyleKeys, StyleType>;

const setStyle = (element: ElementType, key: StyleKeys, value: string | null) => {
  if (element.style[key] || null !== value || null) {
    element.style[key] = (value || null) as string
  }
};

export function style<T extends ElementType, K extends StyleKeys>(
  name: K,
  value: Style,
  externalSymbol?: symbol,
): ComponentOperator<T> {
  return componentOperator(element => {
    const symbol = externalSymbol || Symbol('Style Operator');

    const setElementStyle = (key: StyleKeys, val: string | null) => setStyle(element, key, val);

    return coerceToObservable(value).pipe(
      map(val => val || null),
      startWith(null),
      distinctUntilChanged(),
      tap(val => {
        setAttributes<StyleKeys, string | null>(
          setElementStyle,
          elementMetadataService.getStylesMap(element),
          symbol,
          { [name]: val },
        );

        // elementMetadataService.setStyles(element, symbol, { [name]: val });
        // const primaryValue = elementMetadataService.getStyle(element, name);
        // if (element.style[name] !== primaryValue) {
        //   element.style[name] = (primaryValue || null) as string;
        // }

        // if (primaryValue !== undefined && element.style[name] !== primaryValue) {
        //   element.style[name] = primaryValue as string;
        // }
      }),
    );
  });
}

export type Styles = {
  [K in StyleKeys]?: Style;
};

/**
 * An observable operator to update the styles on an RxFM component.
 * @param stylesOrObservableStyles A dictionary (or observable emitting a dictionary) of style names to values.
 */
export function styles<T extends ElementType>(
  stylesDict: Styles | Observable<StyleObject>,
): ComponentOperator<T> {
  if (stylesDict instanceof Observable) {
    return componentOperator(element => {
      const symbol = Symbol('Styles Operator');
      let previousStyleObject: StyleObject = {};

      const setElementStyle = (key: StyleKeys, val: string | null) => setStyle(element, key, val);

      return stylesDict.pipe(
        startWith({} as StyleObject),
        tap(styleObject => {
          setAttributes(
            setElementStyle,
            elementMetadataService.getStylesMap(element),
            symbol,
            styleObject,
            previousStyleObject,
          );
          previousStyleObject = styleObject;

          // const previousStylesNullValues = Object.keys(previousStyles).reduce((nullValues, key) => {
          //   nullValues[key] = '';
          //   return nullValues;
          // }, {} as Partial<Record<StyleKeys, ''>>);
          // const newStyles = { ...previousStylesNullValues, ...dict };

          // previousStyles = dict;

          // // TODO: Extract out the style setting into seperate function?
          // elementMetadataService.setStyles(element, symbol, newStyles);

          // Object.keys(newStyles).forEach((key: StyleKeys) => {
          //   const primaryValue = elementMetadataService.getStyle(element, key);
          //   if (element.style[key] !== (primaryValue || '')) {
          //     element.style[key] = (primaryValue || null) as string;
          //   }
          // });
        }),
      );
    });
  } else {

    return (input: Component<T>) => {
      const symbol = Symbol('Styles Operator');
      return Object.keys(stylesDict).reduce((component, key: StyleKeys) => {
        return component.pipe(
          style(key, stylesDict[key], symbol),
        );
      }, input);
    }
  }
}
