// import { Observable, of } from 'rxjs';
// import { coerceToArray, coerceToObservable } from '../utils';
// import { ElementType, ComponentOperator, Component } from '../components';
// import { HTMLAttributes } from './html';
// import { SVGAttributes } from './svg';
// import { switchMap, mapTo, distinctUntilChanged, tap, startWith, elementAt } from 'rxjs/operators';
// import { styles, Styles, StaticStyles } from './styles';
// import { classes, ClassType } from './classes';
// import { EventType } from '../events';

import { Observable } from "rxjs";
import { distinctUntilChanged, tap } from "rxjs/operators";
import { componentOperator, ComponentOperator, ElementType } from "../components";
import { elementMetadataService } from "../metadata-service";
import { coerceToObservable, TypeOrObservable } from "../utils";
import { AttributeMetadataDictionary, AttributeMetadataObject, setAttributes } from "./attribute-metadata";
import { ClassType } from "./classes";
import { HTMLAttributes } from "./html";
import { StyleObject, Styles } from "./styles";
import { SVGAttributes } from "./svg";

export interface SpecialAttributes {
  class?: ClassType | ClassType[];
  style?: Styles | Observable<StyleObject>
}

// type AttributeKeys = (keyof HTMLAttributes) | (keyof SVGAttributes);

export interface ElementAttributes extends HTMLAttributes, SVGAttributes {}

/**
 * Allowed types for attribute values used in the 'attributes' operator.
 */
export type AttributeType = string | boolean | number | null;

export type Attribute = AttributeType | Observable<AttributeType>;

export type AttributeDictionary = AttributeMetadataDictionary<string>;

export type AttributeObject = AttributeMetadataObject<string, AttributeType>;

export function attribute<T extends ElementType>(
  type: string,
  value: TypeOrObservable<AttributeType> = '',
  externalSymbol?: symbol,
): ComponentOperator<T> {
  return componentOperator(element => {
    const symbol = externalSymbol || Symbol('Attribute Operator');

    const getAttribute = (key: string) => type === 'value' && element instanceof HTMLInputElement ?
      element.value : element.getAttribute(key) || '';

    const setAttribute = (key: string, val: string | null) => {
      if (key === 'value' && element instanceof HTMLInputElement) {
        element.value = val || '';
      } else if (val !== null) {
        element.setAttribute(key, val);
      } else {
        element.removeAttribute(key);
      }
    };

    return coerceToObservable(value).pipe(
      distinctUntilChanged(),
      tap(val => {
        setAttributes<string, AttributeType>(
          getAttribute,
          (key: string, v: string) => setAttribute(key, val === null ? null : v),
          elementMetadataService.getAttributesMap(element),
          symbol,
          { [type]: val },
        );

        // if (type === 'value' && element instanceof HTMLInputElement) {
        //   if (val !== null) {
        //     element.value = val.toString();
        //   } else {
        //     element.value = '';
        //   }
        // } else if (val !== null) {
        //   element.setAttribute(type, val.toString());
        // } else {
        //   element.removeAttribute(type);
        // }
      }),
    );
  });

  // return (component: Component<T, E>) => component.pipe(
  //   switchMap(comp => coerceToObservable(value).pipe(
  //     distinctUntilChanged(),
  //     tap(val => {
  //       if (type === 'value' && comp.element instanceof HTMLInputElement) {
  //         comp.element.value = val.toString();
  //       } else if (val || typeof val === 'number') {
  //         comp.element.setAttribute(type, val.toString());
  //       } else {
  //         comp.element.removeAttribute(type);
  //       }
  //     }),
  //     mapTo(comp),
  //     startWith(comp),
  //     distinctUntilChanged(),
  //   )),
  // );
}

// /**
//  * A dictionary of attributes or observable attributes to be used in the 'attributes' operator.
//  */
export type Attributes = {
  [K in keyof ElementAttributes]?: TypeOrObservable<AttributeType>;
} & SpecialAttributes & Partial<Record<string, TypeOrObservable<AttributeType>>>;

// // /**
// //  * An observable operator to update the attributes on an RxFM component.
// //  * @param attributesOrObservableAttrs A dictionary (or observable emitting a dictionary) of attribute names to
// //  * attribute values. Attribute values may be strings, numbers, or booleans, or observables emitting these types.
// //  */
// export function attributes<T extends ElementType, E extends EventType>(
//   attributeDict: IAttributes,
// ): ComponentOperator<T, E> {
//   return (input: Component<T, E>) => Object.keys(attributeDict)
//   .filter(key => attributeDict[key] !== undefined)
//   .reduce((component, key) => {
//     if (key === 'style') {
//       return component.pipe(styles(attributeDict.style!));
//     } else if (key === 'class') {
//       return component.pipe(classes(...coerceToArray(attributeDict.class!)));
//     }
//     return component.pipe(attribute(key, attributeDict[key]!));
//   }, input);
// }
