// import { Observable, of } from 'rxjs';
// import { coerceToArray, coerceToObservable } from '../utils';
// import { ElementType, ComponentOperator, Component } from '../components';
// import { HTMLAttributes } from './html';
// import { SVGAttributes } from './svg';
// import { switchMap, mapTo, distinctUntilChanged, tap, startWith, elementAt } from 'rxjs/operators';
// import { styles, Styles, StaticStyles } from './styles';
// import { classes, ClassType } from './classes';
// import { EventType } from '../events';

// export type TypeOrObservable<T> = T | Observable<T>;

// export interface SpecialAttributes {
//   class?: ClassType | ClassType[];
//   style?: Styles | Observable<StaticStyles>
// }

// // /**
// //  * Allowed types for attribute values used in the 'attributes' operator.
// //  */
// export type AttributeType = string | boolean | number;

// // /**
// //  * A dictionary of attributes or observable attributes to be used in the 'attributes' operator.
// //  */
// export type IAttributes = {
//   [K in keyof (HTMLAttributes & SVGAttributes)]?: TypeOrObservable<AttributeType>;
// } & SpecialAttributes;

// export function attribute<T extends ElementType, E extends EventType = never>(
//   type: string,
//   value: TypeOrObservable<AttributeType>,
// ): ComponentOperator<T, E> {
//   return (component: Component<T, E>) => component.pipe(
//     switchMap(comp => coerceToObservable(value).pipe(
//       distinctUntilChanged(),
//       tap(val => {
//         if (type === 'value' && comp.element instanceof HTMLInputElement) {
//           comp.element.value = val.toString();
//         } else if (val || typeof val === 'number') {
//           comp.element.setAttribute(type, val.toString());
//         } else {
//           comp.element.removeAttribute(type);
//         }
//       }),
//       mapTo(comp),
//       startWith(comp),
//       distinctUntilChanged(),
//     )),
//   );
// }

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
