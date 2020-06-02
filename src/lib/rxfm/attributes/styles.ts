// import { Observable, of } from 'rxjs';
// import { ComponentOld, ComponentOperatorOld } from '../components';
// import { switchMap, map, startWith } from 'rxjs/operators';
// import { distinctUntilKeysChanged } from '../utils';

import { Observable, of } from 'rxjs';
import { ElementType, EventType, ComponentOperator, ComponentObservable } from '../components';
import { map, switchMap, tap, mapTo, distinctUntilChanged } from 'rxjs/operators';
import { coerceToObservable } from '../utils';
import { NullLike } from '../children/children';

export type StyleKeys = Extract<keyof CSSStyleDeclaration, string>;

export type StyleType<K extends StyleKeys> = CSSStyleDeclaration[K] | NullLike;

export type Style<K extends StyleKeys> = StyleType<K> | Observable<StyleType<K>>

export function style<T extends ElementType, E extends EventType, K extends StyleKeys>(
  name: K,
  value: Style<K>,
): ComponentOperator<T, E> {
  return (input: ComponentObservable<T, E>) => input.pipe(
    switchMap(component => coerceToObservable(value).pipe(
      distinctUntilChanged(),
      tap(val => val ? component.element.style[name] = val : component.element.style[name] = null as any),
      mapTo(component),
    )),
    distinctUntilChanged(),
  );
}

export type Styles = {
  [K in StyleKeys]?: Style<K>;
};

export type StylesOrNull = { [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] | null }

export function styles<T extends ElementType, E extends EventType>(
  stylesDict: Styles | Observable<StylesOrNull>,
): ComponentOperator<T, E> {
  return (input: ComponentObservable<T, E>) => {
    if (stylesDict instanceof Observable) {

      let previousStyles: StylesOrNull = {};
      return input.pipe(
        switchMap(component => stylesDict.pipe(
          tap(dict => {
            Object.keys(dict).forEach(key => {
              if (dict[key] !== previousStyles[key]) {
                component.element.style[key] = dict[key];
              }
            });
            previousStyles = dict;
          }),
          mapTo(component),
          distinctUntilChanged(),
        ))
      );
    } else {

      return Object.keys(stylesDict).reduce((component, key: StyleKeys) => component.pipe(
        style(key, stylesDict[key]),
      ), input);
    }
  }
}

// export function styles<T extends ElementType, E extends EventType>(
//   style: Styles | Observable<Partial<CSSStyleDeclaration>>,
// ): ComponentOperator<T, E> {

//   const stylesObservable = coerceToObservable(style);

//   const res = stylesObservable.pipe(
//     map(styleDictionary => {
//       const styleObservables = Object.keys(styleDictionary).map(
//         key => coerceToObservable(styleDictionary[key]).pipe(
//           map(value => [key, value] as const),
//         ),
//       )
//     }),
//   );
// }

// // TODO: Add option to provide observable values inside object.
// /**
//  * An observable operator to update the styles on an RxFM component.
//  * @param stylesOrObservableStyles A dictionary (or observable emitting a dictionary) of style names to values.
//  */
// export function styles<T extends HTMLElement, E>(
//   stylesOrObservableStyles: Partial<CSSStyleDeclaration> | Observable<Partial<CSSStyleDeclaration>>
// ): ComponentOperatorOld<T, E> {
//   return (component: ComponentOld<T, E>) =>
//     component.pipe(
//       switchMap(({ node, events }) => {
//         const stylesObservable = stylesOrObservableStyles instanceof Observable // Coerce to observable.
//           ? stylesOrObservableStyles
//           : of(stylesOrObservableStyles);
//         let previousStyles: Partial<CSSStyleDeclaration> = {}; // Keep track of old styles.
//         return stylesObservable.pipe(
//           map(style => {
//             Object.keys(style) // Loop through new styles an update element with any changed style values.
//               .filter(key => style[key] !== previousStyles[key])
//               .forEach(key => (node.style[key] = style[key] || null));
//             previousStyles = { ...previousStyles, ...style }; // Store current state.
//             return { node, events };
//           }),
//           startWith({ node, events })
//         );
//       }),
//       distinctUntilKeysChanged(),
//     );
// }
