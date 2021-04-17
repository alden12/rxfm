import { Observable } from "rxjs";
import { distinctUntilChanged, startWith, tap } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "../components";
import { elementMetadataService } from "../metadata-service";
import { coerceToObservable, PartialRecord, TypeOrObservable } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject, setAttributes } from "./attribute-metadata";
import { ClassType } from "./classes";
import { HTMLAttributes } from "./html";
import { StyleObject, Styles } from "./styles";
import { SVGAttributes } from "./svg";

export interface ElementAttributes extends HTMLAttributes, SVGAttributes {}

export type AttributeKeys = keyof ElementAttributes;

/**
 * Allowed types for attribute values used in the 'attributes' operator.
 */
export type AttributeType = string | boolean | number | null;

export type AttributeDictionary = AttributeMetadataDictionary<string>;

export type AttributeObject = AttributeMetadataObject<string, AttributeType>;

const setAttribute = (element: ElementType, key: string, val: string | null) => {
  if (key === 'value' && element instanceof HTMLInputElement) {
    const stringValue = val || '';
    if (element.value !== stringValue) {
      element.value = stringValue;
    }
  } else if (val !== null) {
    element.setAttribute(key, val);
  } else {
    element.removeAttribute(key);
  }
};

export function attribute<T extends ElementType>(
  type: string,
  value: TypeOrObservable<AttributeType> = '',
  externalSymbol?: symbol,
): ComponentOperator<T> {
  return componentOperator(element => {
    const symbol = externalSymbol || Symbol('Attribute Operator');

    const setElementAttribute = (key: string, val: string | null) => setAttribute(element, key, val);

    return coerceToObservable(value).pipe(
      startWith(null),
      distinctUntilChanged(),
      tap(val => setAttributes<string, AttributeType>(
        setElementAttribute,
        elementMetadataService.getAttributesMap(element),
        symbol,
        { [type]: val },
      )),
    );
  });
}

export interface SpecialAttributes {
  class?: ClassType | ClassType[];
  style?: Styles | Observable<StyleObject>
}

// /**
//  * A dictionary of attributes or observable attributes to be used in the 'attributes' operator.
//  */
export type Attributes =
  PartialRecord<AttributeKeys, TypeOrObservable<AttributeType>> &
  SpecialAttributes |
  PartialRecord<string, TypeOrObservable<AttributeType>>;

// // /**
// //  * An observable operator to update the attributes on an RxFM component.
// //  * @param attributesOrObservableAttrs A dictionary (or observable emitting a dictionary) of attribute names to
// //  * attribute values. Attribute values may be strings, numbers, or booleans, or observables emitting these types.
// //  */
export function attributes<T extends ElementType>(
  attributesDict: Attributes | Observable<AttributeObject>,
): ComponentOperator<T> {
  if (attributesDict instanceof Observable) {
    return componentOperator(element => {
      const symbol = Symbol('Attributes Operator');
      let previousAttributeObject: AttributeObject = {};

      const setElementAttribute = (key: string, val: string | null) => setAttribute(element, key, val);

      return attributesDict.pipe(
        startWith({} as AttributeObject),
        tap(attributeObject => {
          setAttributes(
            setElementAttribute,
            elementMetadataService.getAttributesMap(element),
            symbol,
            attributeObject,
            previousAttributeObject,
          );
          previousAttributeObject = attributeObject;
        }),
      );
    });
  } else {

    return (input: Component<T>) => {
      const symbol = Symbol('Attributes Operator');
      return Object.keys(attributesDict).reduce((component, key) => {
        return component.pipe(
          attribute(key, attributesDict[key], symbol),
        );
      }, input);
    }
  }
}
