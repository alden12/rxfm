import { Observable } from "rxjs";
import { distinctUntilChanged, startWith, tap } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "../components";
import { operatorIsolationService } from "../operator-isolation-service";
import { coerceToObservable, PartialRecord, TypeOrObservable } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject, setAttributes } from "./attribute-operator-isolation";
import { ClassType } from "./classes";
import { HTMLAttributes } from "./html";
import { StyleObject, Styles } from "./styles";
import { SVGAttributes } from "./svg";

/**
 * A map of the possible attribute types available on RxFM elements.
 */
export interface ElementAttributes extends HTMLAttributes, SVGAttributes {}

/**
 * The attribute type names available on RxFM elements.
 */
export type AttributeKeys = keyof ElementAttributes;

/**
 * Allowed types for attribute values used in the 'attributes' operator.
 */
export type AttributeType = string | boolean | number | null;

/**
 * A dictionary of element attribute names to string values or null.
 */
export type AttributeDictionary = AttributeMetadataDictionary<string>;

/**
 * A dictionary of element attribute names to possible value types.
 */
export type AttributeObject = AttributeMetadataObject<string, AttributeType>;

/**
 * Set an attribute on an element.
 */
const setAttribute = (element: ElementType, key: string, val: string | null) => {
  if (key === 'value' && element instanceof HTMLInputElement) {
    const stringValue = val || ''; // Make sure 'value' attribute of input elements is always a string.
    if (element.value !== stringValue) {
      element.value = stringValue;
    }
  } else if (val !== null) {
    element.setAttribute(key, val);
  } else { // Remove null attributes.
    element.removeAttribute(key);
  }
};

// TODO: Add option to pass attribute as: attribute.type`text` or attribute.checked(done).
/**
 * An observable operator to manage an attribute on an RxFM component.
 * @param type The attribute type.
 * @param value The attribute value or an observable emitting the value.
 * @param externalSymbol Implementation detail so that this operator may be used as the basis for the attributes operator.
 */
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
        operatorIsolationService.getAttributesMap(element),
        symbol,
        { [type]: val },
      )),
    );
  });
}

/**
 * Element attributes which have a different interface to others.
 */
export interface SpecialAttributes {
  class?: ClassType | ClassType[];
  style?: Styles | Observable<StyleObject>
}

/**
 * A dictionary of attributes or observable attributes to be used in the 'attributes' operator.
 */
export type Attributes =
  PartialRecord<AttributeKeys, TypeOrObservable<AttributeType>> &
  SpecialAttributes |
  PartialRecord<string, TypeOrObservable<AttributeType>>;

/**
 * An observable operator to update the attributes on an RxFM component.
 * @param attributesOrObservableAttrs A dictionary (or observable emitting a dictionary) of attribute names to
 * attribute values. Attribute values may be strings, numbers, or booleans, or observables emitting these types.
 */
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
            operatorIsolationService.getAttributesMap(element),
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
          attribute(key, attributesDict[key as AttributeKeys], symbol),
        );
      }, input);
    };
  }
}
