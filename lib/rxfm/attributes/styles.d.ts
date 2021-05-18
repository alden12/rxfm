import { Observable } from "rxjs";
import { ComponentOperator, ElementType } from "../components";
import { NullLike, TypeOrObservable } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject } from "./attribute-operator-isolation";
/**
 * The style names which may be applied to an RxFM element.
 */
export declare type StyleKeys = Extract<keyof {
    [K in keyof CSSStyleDeclaration as CSSStyleDeclaration[K] extends string ? K : never]: CSSStyleDeclaration[K];
}, string>;
/**
 * The types which may be applied as a style.
 */
export declare type StyleType = string | NullLike;
/**
 * A dictionary of element style names to string values or null.
 */
export declare type StyleDictionary = AttributeMetadataDictionary<StyleKeys>;
/**
 * A dictionary of element style names to possible value types.
 */
export declare type StyleObject = AttributeMetadataObject<StyleKeys, StyleType>;
/**
 * An observable operator to manage a style on an RxFM component.
 * @param name The style name.
 * @param value The style value or an observable emitting the value.
 * @param externalSymbol Implementation detail so that this operator may be used as the basis for the styles operator.
 */
export declare function style<T extends ElementType, K extends StyleKeys>(name: K, value: TypeOrObservable<StyleType>, externalSymbol?: symbol): ComponentOperator<T>;
/**
 * A dictionary of styles or observable styles to be used in the 'styles' operator.
 */
export declare type Styles = {
    [K in StyleKeys]?: TypeOrObservable<StyleType>;
};
/**
 * An observable operator to update the styles on an RxFM component.
 * @param stylesOrObservableStyles A dictionary (or observable emitting a dictionary) of style names to values.
 * Values may be strings, null-like or observables emitting these.
 */
export declare function styles<T extends ElementType>(stylesDict: Styles | Observable<StyleObject>): ComponentOperator<T>;
