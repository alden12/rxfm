import { Observable } from "rxjs";
import { ComponentOperator, ElementType } from "../components";
import { PartialRecord, TypeOrObservable } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject } from "./attribute-metadata";
import { ClassType } from "./classes";
import { HTMLAttributes } from "./html";
import { StyleObject, Styles } from "./styles";
import { SVGAttributes } from "./svg";
export interface ElementAttributes extends HTMLAttributes, SVGAttributes {
}
export declare type AttributeKeys = keyof ElementAttributes;
/**
 * Allowed types for attribute values used in the 'attributes' operator.
 */
export declare type AttributeType = string | boolean | number | null;
export declare type AttributeDictionary = AttributeMetadataDictionary<string>;
export declare type AttributeObject = AttributeMetadataObject<string, AttributeType>;
export declare function attribute<T extends ElementType>(type: string, value?: TypeOrObservable<AttributeType>, externalSymbol?: symbol): ComponentOperator<T>;
export interface SpecialAttributes {
    class?: ClassType | ClassType[];
    style?: Styles | Observable<StyleObject>;
}
export declare type Attributes = (PartialRecord<AttributeKeys, TypeOrObservable<AttributeType>> & SpecialAttributes) | PartialRecord<string, TypeOrObservable<AttributeType>>;
export declare function attributes<T extends ElementType>(attributesDict: Attributes | Observable<AttributeObject>): ComponentOperator<T>;
