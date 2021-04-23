import { Observable } from "rxjs";
import { ComponentOperator, ElementType } from "../components";
import { NullLike, TypeOrObservable } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject } from "./attribute-metadata";
export declare type StyleKeys = Exclude<Extract<keyof CSSStyleDeclaration, string>, 'getPropertyPriority' | 'getPropertyValue' | 'item' | 'removeProperty' | 'setProperty' | 'parentRule' | 'length'>;
export declare type StyleType = string | NullLike;
export declare type StyleDictionary = AttributeMetadataDictionary<StyleKeys>;
export declare type StyleObject = AttributeMetadataObject<StyleKeys, StyleType>;
export declare function style<T extends ElementType, K extends StyleKeys>(name: K, value: TypeOrObservable<StyleType>, externalSymbol?: symbol): ComponentOperator<T>;
export declare type Styles = {
    [K in StyleKeys]?: TypeOrObservable<StyleType>;
};
/**
 * An observable operator to update the styles on an RxFM component.
 * @param stylesOrObservableStyles A dictionary (or observable emitting a dictionary) of style names to values.
 */
export declare function styles<T extends ElementType>(stylesDict: Styles | Observable<StyleObject>): ComponentOperator<T>;
