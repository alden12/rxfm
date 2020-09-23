// import { combineLatest, Observable, of } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { ClassType, IAttributes, Styles, StylesOrNull } from '../attributes';
// import { coerceToArray, coerceToObservable, filterObject, NullLike } from '../utils';
// import { StyleKeys, StyleType } from '../attributes/styles';

// function mergeClasses(
//   primaryClasses: ClassType | ClassType[] | NullLike,
//   secondaryClasses: ClassType | ClassType[] | NullLike,
// ): ClassType[] {
//   return [
//     ...(primaryClasses ? coerceToArray(primaryClasses) : []),
//     ...(secondaryClasses ? coerceToArray(secondaryClasses) : [])
//   ];
// }

// type StyleObservables = {
//   [K in StyleKeys]?: Observable<StyleType<K>>;
// };

// function getStylesObservable(
//   styles: Styles | Observable<StylesOrNull>,
// ): Observable<StylesOrNull> {
//   if (styles instanceof Observable) {
//     return styles;
//   } else if (Object.keys(styles).some(key => styles[key] instanceof Observable)) {
//     const staticStyles = filterObject(styles, value => !(value instanceof Observable)) as StylesOrNull;
//     const styleObservables = Object.keys(styles)
//       .filter(key => styles[key] instanceof Observable)
//       .map((key: StyleKeys) => (styles[key] as Observable<CSSStyleDeclaration[StyleKeys]>).pipe(
//         map(value => ({ key, value })),
//       ));

//     const res = combineLatest(styleObservables).pipe();
//   } else {
//     return of(styles as StylesOrNull);
//   }
// }

// function mergeStyles(
//   primaryStyles: Styles | Observable<StylesOrNull> | undefined,
//   secondaryStyles: Styles | Observable<StylesOrNull> | undefined,
// ): Styles | Observable<StylesOrNull> {
//   // const primaryStylesObservable = primaryStyles ? coerceToObservable(primaryStyles) : of({} as Styles);
//   // const secondaryStylesObservable = secondaryStyles ? coerceToObservable(secondaryStyles) : of({} as Styles);
//   // return combineLatest([primaryStylesObservable, secondaryStylesObservable]).pipe(
//   //   map(([primStyles, secStyles]) => ({ ...secStyles, ...primStyles })),
//   // );

// }

// export function mergeAttributes(
//   primaryAttributes: IAttributes,
//   secondaryAttributes: IAttributes,
// ): IAttributes {
//   return {
//     ...secondaryAttributes,
//     ...primaryAttributes,
//     class: mergeClasses(primaryAttributes.class, secondaryAttributes.class),
//     style: mergeStyles(primaryAttributes.style, secondaryAttributes.style),
//   };
// }
