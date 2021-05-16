import { Observable } from "rxjs";
import { distinctUntilChanged, map, startWith, tap } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "../components";
import { elementMetadataService } from "../metadata-service";
import { coerceToObservable, NullLike, TypeOrObservable } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject, setAttributes } from "./attribute-metadata";

export type StyleKeys = Extract<
  keyof { [K in keyof CSSStyleDeclaration as CSSStyleDeclaration[K] extends string ? K : never]: CSSStyleDeclaration[K] },
  string
>

export type StyleType = string | NullLike;

export type StyleDictionary = AttributeMetadataDictionary<StyleKeys>;

export type StyleObject = AttributeMetadataObject<StyleKeys, StyleType>;

const setStyle = (element: ElementType, key: StyleKeys, value: string | null) => {
  if (element.style[key] || null !== value || null) {
    element.style[key] = (value || null) as string
  }
};

export function style<T extends ElementType, K extends StyleKeys>(
  name: K,
  value: TypeOrObservable<StyleType>,
  externalSymbol?: symbol,
): ComponentOperator<T> {
  return componentOperator(element => {
    const symbol = externalSymbol || Symbol('Style Operator');

    const setElementStyle = (key: StyleKeys, val: string | null) => setStyle(element, key, val);

    return coerceToObservable(value).pipe(
      map(val => val || null),
      startWith(null),
      distinctUntilChanged(),
      tap(val => setAttributes<StyleKeys, string | null>(
        setElementStyle,
        elementMetadataService.getStylesMap(element),
        symbol,
        { [name]: val },
      )),
    );
  });
}

export type Styles = {
  [K in StyleKeys]?: TypeOrObservable<StyleType>;
};

// TODO: Coerce styles to observable and use same operator for all cases?
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
        }),
      );
    });
  } else {

    return (input: Component<T>) => {
      const symbol = Symbol('Styles Operator');
      return Object.keys(stylesDict).reduce((component, key) => {
        return component.pipe(
          style(key as StyleKeys, stylesDict[key as StyleKeys], symbol),
        );
      }, input);
    }
  }
}
