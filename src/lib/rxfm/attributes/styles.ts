// import { Observable } from 'rxjs';
// import { ElementType, ComponentOperator, Component } from '../components';
// import { switchMap, tap, mapTo, distinctUntilChanged, startWith } from 'rxjs/operators';
// import { coerceToObservable, NullLike } from '../utils';
// import { EventType } from '../events';

import { Observable } from "rxjs";
import { distinctUntilChanged, map, mapTo, startWith, switchMap, tap } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "../components";
import { stylesModifierService } from "./styles-modifier-service";
import { coerceToObservable, NullLike } from "../utils";

// TODO: Find a better way to exclude, perhaps { [K in keyof T as T[K] extends string ? K : never]: T[K] } in TS4.1
export type StyleKeys = Exclude<
  Extract<keyof CSSStyleDeclaration, string>,
  'getPropertyPriority' | 'getPropertyValue' | 'item' | 'removeProperty' | 'setProperty' | 'parentRule' | 'length'
>;

export type StyleType = string | NullLike;

export type Style = StyleType | Observable<StyleType>

export type StyleObject = Partial<Record<StyleKeys, StyleType>>;

export function style<T extends ElementType, K extends StyleKeys>(
  name: K,
  value: Style,
): ComponentOperator<T> {
  return componentOperator(element => {
    const symbol = Symbol('Style Operator');

    return coerceToObservable(value).pipe(
      map(val => val || null),
      startWith(undefined),
      distinctUntilChanged(),
      tap(val => {
        stylesModifierService.setStyles(element, symbol, { [name]: val });
        const primaryValue = stylesModifierService.getStyle(element, name);
        if (primaryValue !== undefined && element.style[name] !== primaryValue) {
          element.style[name] = primaryValue as string;
        }
      }),
    );
  });
}

// export type Styles = {
//   [K in StyleKeys]?: Style;
// };

// export type StaticStyles = {
//   [K in StyleKeys]?: StyleType;
// };

// // /**
// //  * An observable operator to update the styles on an RxFM component.
// //  * @param stylesOrObservableStyles A dictionary (or observable emitting a dictionary) of style names to values.
// //  */
// export function styles<T extends ElementType, E extends EventType>(
//   stylesDict: Styles | Observable<StaticStyles>,
// ): ComponentOperator<T, E> {
//   return (input: Component<T, E>) => {
//     if (stylesDict instanceof Observable) {

//       let previousStyles: StaticStyles = {};
//       return input.pipe(
//         switchMap(component => stylesDict.pipe(
//           tap(dict => {
//             Object.keys(dict).forEach(key => {
//               if (dict[key] !== previousStyles[key]) {
//                 component.element.style[key] = dict[key];
//               }
//             });
//             previousStyles = dict;
//           }),
//           mapTo(component),
//           startWith(component),
//           distinctUntilChanged(),
//         ))
//       );
//     } else {

//       return Object.keys(stylesDict).reduce((component, key: StyleKeys) => component.pipe(
//         style(key, stylesDict[key]),
//       ), input);
//     }
//   }
// }
