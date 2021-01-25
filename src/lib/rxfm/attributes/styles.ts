// import { Observable } from 'rxjs';
// import { ElementType, ComponentOperator, Component } from '../components';
// import { switchMap, tap, mapTo, distinctUntilChanged, startWith } from 'rxjs/operators';
// import { coerceToObservable, NullLike } from '../utils';
// import { EventType } from '../events';

import { Observable } from "rxjs";
import { distinctUntilChanged, mapTo, startWith, switchMap, tap } from "rxjs/operators";
import { Component, componentOperator, ComponentOperator, ElementType } from "../components";
import { coerceToObservable, NullLike } from "../utils";

// TODO: Find a better way to exclude, perhaps { [K in keyof T as T[K] extends string ? K : never]: T[K] } in TS4.1
export type StyleKeys = Exclude<
  Extract<keyof CSSStyleDeclaration, string>,
  'getPropertyPriority' | 'getPropertyValue' | 'item' | 'removeProperty' | 'setProperty' | 'parentRule' | 'length'
>;

export type StyleType = string | NullLike;

export type Style = StyleType | Observable<StyleType>

export function style<T extends ElementType, K extends StyleKeys>(
  name: K,
  value: Style,
): ComponentOperator<T> {
  return componentOperator(element => coerceToObservable(value).pipe(
    startWith(null),
    distinctUntilChanged(),
    tap(val => val ? element.style[name] = val : element.style[name] = null as any),
  ));
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
