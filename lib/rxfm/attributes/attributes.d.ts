import { Observable } from "rxjs";
import { ComponentOperator, ElementType } from "../components";
import { PartialRecord, TypeOrObservable } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject } from "./attribute-operator-isolation";
import { ClassType } from "./classes";
import { HTMLAttributes } from "./html";
import { StyleObject, Styles } from "./styles";
import { SVGAttributes } from "./svg";
/**
 * A map of the possible attribute types available on RxFM elements.
 */
export interface ElementAttributes extends HTMLAttributes, SVGAttributes {
}
/**
 * The attribute type names available on RxFM elements.
 */
export declare type AttributeKeys = keyof ElementAttributes;
/**
 * Allowed types for attribute values used in the 'attributes' operator.
 */
export declare type AttributeType = string | boolean | number | null;
/**
 * A dictionary of element attribute names to string values or null.
 */
export declare type AttributeDictionary = AttributeMetadataDictionary<string>;
/**
 * A dictionary of element attribute names to possible value types.
 */
export declare type AttributeObject = AttributeMetadataObject<string, AttributeType>;
/**
 * An observable operator to manage an attribute on an RxFM component.
 * @param type The attribute type.
 * @param value The attribute value or an observable emitting the value.
 * @param externalSymbol Implementation detail so that this operator may be used as the basis for the attributes operator.
 */
export declare function attribute<T extends ElementType>(type: string, value?: TypeOrObservable<AttributeType>, externalSymbol?: symbol): ComponentOperator<T>;
/**
 * Element attributes which have a different interface to others.
 */
export interface SpecialAttributes {
    class?: ClassType | ClassType[];
    style?: Styles | Observable<StyleObject>;
}
/**
 * A dictionary of attributes or observable attributes to be used in the 'attributes' operator.
 */
export declare type Attributes = PartialRecord<AttributeKeys, TypeOrObservable<AttributeType>> & SpecialAttributes | PartialRecord<string, TypeOrObservable<AttributeType>>;
/**
 * An observable operator to update the attributes on an RxFM component.
 * @param attributesOrObservableAttrs A dictionary (or observable emitting a dictionary) of attribute names to
 * attribute values. Attribute values may be strings, numbers, or booleans, or observables emitting these types.
 */
export declare function attributes<T extends ElementType>(attributesDict: Attributes | Observable<AttributeObject>): ComponentOperator<T>;
