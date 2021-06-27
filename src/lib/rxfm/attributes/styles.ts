import { combineLatest, Observable, of } from "rxjs";
import { distinctUntilChanged, map, startWith, tap } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "../components";
import { operatorIsolationService } from "../operator-isolation-service";
import { coerceToObservable, NullLike, StringLike, TypeOrObservable } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject, setAttributes } from "./attribute-operator-isolation";

/**
 * The style names which may be applied to an RxFM element.
 */
export type StyleKeys = Extract<
  keyof { [K in keyof CSSStyleDeclaration as CSSStyleDeclaration[K] extends string ? K : never]: CSSStyleDeclaration[K] },
  string
>;

/**
 * The types which may be applied as a style.
 */
export type StyleType = string | NullLike;

/**
 * A dictionary of element style names to string values or null.
 */
export type StyleDictionary = AttributeMetadataDictionary<StyleKeys>;

/**
 * A dictionary of element style names to possible value types.
 */
export type StyleObject = AttributeMetadataObject<StyleKeys, StyleType>;

/**
 * Apply a style to an element.
 */
const setStyle = (element: ElementType, key: StyleKeys, value: string | null) => {
  if (element.style[key] || null !== value || null) { // If style has changed (coercing empty string to null).
    element.style[key] = (value || null) as string; // Set style or remove by setting to null.
  }
};

type BasicStyleOperator = {
  <T extends ElementType, K extends StyleKeys>(name: K, value: TypeOrObservable<StyleType>): ComponentOperator<T>;
};

function basicStyleOperator<T extends ElementType, K extends StyleKeys>(
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
        operatorIsolationService.getStylesMap(element),
        symbol,
        { [name]: val },
      )),
    );
  });
}

type IndividualStyleOperator = {
  <T extends ElementType>(value: TypeOrObservable<StyleType>): ComponentOperator<T>;
  // TODO: Replace return type with ComponentOperator once TS tagged template operator type inference is fixed.
  (templateStrings: TemplateStringsArray, ...expressions: TypeOrObservable<StringLike>[]):
    <T extends ElementType>(component: Component<T>) => Component<T>;
};

/**
 * Create a style operator for an individual style key.
 * @param styleOperator The generic style operator.
 * @param key The style type key.
 */
 function getIndividualStyleOperator(styleOperator: BasicStyleOperator, key: StyleKeys): IndividualStyleOperator {
  return <T extends ElementType>(
    valueOrTemplateStrings: TypeOrObservable<StyleType> | TemplateStringsArray,
    ...expressions: TypeOrObservable<StringLike>[]
  ): ComponentOperator<T> => {
    if (!Array.isArray(valueOrTemplateStrings)) {
      return styleOperator(key, valueOrTemplateStrings as TypeOrObservable<StyleType>);
    } else {
      const styleObservables = (valueOrTemplateStrings as TemplateStringsArray)
        .reduce<Observable<StringLike>[]>((acc, str, i) => {
          acc.push(of(str));
          if (expressions[i]) acc.push(coerceToObservable(expressions[i]));
          return acc;
        }, []);
      const styleObservable = combineLatest(styleObservables).pipe(
        map(strings => strings.join('')),
      );
      return styleOperator(key, styleObservable);
    }
  };
}

type StyleOperators = {
  [E in StyleKeys]: IndividualStyleOperator;
};

export type StyleOperator = BasicStyleOperator & StyleOperators;

/**
 * An observable operator to manage a style on an RxFM component.
 * Alternatively style operators for specific style types may be accessed directly as properties eg: `style.color('red')`.
 * @param name The style name.
 * @param value The style value or an observable emitting the value.
 * @param externalSymbol Implementation detail so that this operator may be used as the basis for the styles operator.
 */
export const style = new Proxy(basicStyleOperator, {
  get: (styleOperator, prop: StyleKeys) => getIndividualStyleOperator(styleOperator, prop),
}) as StyleOperator;

/**
 * A dictionary of styles or observable styles to be used in the 'styles' operator.
 */
export type Styles = {
  [K in StyleKeys]?: TypeOrObservable<StyleType>;
};

/**
 * An observable operator to update the styles on an RxFM component.
 * @param stylesOrObservableStyles A dictionary (or observable emitting a dictionary) of style names to values.
 * Values may be strings, null-like or observables emitting these.
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
            operatorIsolationService.getStylesMap(element),
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
          basicStyleOperator(key as StyleKeys, stylesDict[key as StyleKeys], symbol),
        );
      }, input);
    };
  }
}
