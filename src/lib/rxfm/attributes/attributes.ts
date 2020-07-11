// import { Observable, of, combineLatest } from 'rxjs';
// import { map, switchMap, startWith, debounceTime } from 'rxjs/operators';
// import { attributeDiffer } from './attribute-differ';
// import { ComponentOld, ComponentOperatorOld } from '../components';
// import { distinctUntilKeysChanged } from '../utils';
import { OperatorFunction, Observable, of, combineLatest } from 'rxjs';
import { EmitEvent } from '../events';
import { Dictionary, coerceToArray } from '../utils';
import { ElementType, ComponentOperator, ComponentObservable, EventType } from '../components';
import { HTMLAttributes } from './html';
import { SVGAttributes } from './svg';
import { switchMap, mapTo, distinctUntilChanged, tap, map, debounceTime, startWith } from 'rxjs/operators';
import { styles, Styles, StylesOrNull } from './styles';
import { classes, ClassType } from './classes';

// export type EventOperators<E> = {
//   [K in keyof ElementEventMap]?: OperatorFunction<ElementEventMap[K], E>;
// }

// export type AttributeEvents<T extends EventOperators<any>> = T extends EventOperators<infer E> ?
//   E extends EmitEvent<infer ET, infer EV> ? Record<ET, EV> : never : never;

// export type EventOperators<E> = {
//   [K in keyof ElementEventMap]: OperatorFunction<ElementEventMap[K], E>;
// }
export type TypeOrObservable<T> = T | Observable<T>;

export interface SpecialAttributes {
  class?: ClassType | ClassType[];
  style?: Styles | Observable<StylesOrNull>
}

export type AttributeType = string | boolean | number;

export type IAttributes = {
  [K in keyof (HTMLAttributes & SVGAttributes)]?: TypeOrObservable<AttributeType>;
} & SpecialAttributes;

export function attribute<T extends ElementType, E extends EventType>(
  type: string,
  value: TypeOrObservable<AttributeType>,
): ComponentOperator<T, E> {
  return (component: ComponentObservable<T, E>) => component.pipe(
    switchMap(comp => {
      const attributeObservable = value instanceof Observable ? value : of(value);
      return attributeObservable.pipe(
        distinctUntilChanged(),
        tap(val => val || typeof val === 'number' ?
          comp.element.setAttribute(type, val.toString()) : comp.element.removeAttribute(type)),
        mapTo(comp),
        startWith(comp),
        distinctUntilChanged(),
      );
    }),
  );
}

export function attributes<T extends ElementType, E extends EventType>(
  attributeDict: IAttributes,
): ComponentOperator<T, E> {
  return (input: ComponentObservable<T, E>) => Object.keys(attributeDict)
  .filter(key => attributeDict[key] !== undefined)
  .reduce((component, key) => {
    if (key === 'style') {
      return component.pipe(styles(attributeDict.style!));
    } else if (key === 'class') {
      return component.pipe(classes(...coerceToArray(attributeDict.class!)));
    }
    return component.pipe(attribute(key, attributeDict[key]!));
  }, input);
}

// export function attributes<T extends ElementType, E extends EventType>(
//   attributeDict: Dictionary<string | Observable<string>>,
// ): ComponentOperator<T, E> {
//   const res = (component: ComponentObservable<T, E>) => component.pipe(
//     switchMap(comp => {
//       const attributeObservables = Object.keys(attributeDict).map<Observable<[string, string]>>(key => {
//         const value = attributeDict[key];
//         const attributeObservable = value instanceof Observable ? value : of(value);
//         return attributeObservable.pipe(
//           map(val => [key, val])
//         )
//       });
//       return combineLatest(attributeObservables).pipe(
//         debounceTime(0),
//         map(keyValPairs => keyValPairs.reduce((result, [name, value]) => {
//           result[name] = value;
//           return result;
//         }, {} as StringAttributes)),
//       );
//     }),
//   );
// }

// export type KnownPartial<T> = {
//   [K in keyof T]?:
// };

// export type Attributes = {
//   // [key: string]: key extends keyof
// };

// export interface InputAttributes extends GlobalAttributes {
//   accept: string;
//   alt: string;
//   type: string;
// }

// export interface ElementAttributeMap {
//   input: InputAttributes;
// }

// export type ElementAttributes<T extends ElementType> = T extends keyof ElementAttributeMap ?
//   ElementAttributeMap[T] : GlobalAttributes;

////

// /**
//  * Allowed types for attribute values used in the 'attributes' operator.
//  */
// export type AttributeType = string | number | boolean;

// /**
//  * A dictionary of attributes or observable attributes to be used in the 'attributes' operator.
//  */
// export type Attributes = { [attr: string]: AttributeType | Observable<AttributeType>};

// /**
//  * A dictionary of attribute names to string values.
//  */
// export interface StringAttributes { [attr: string]: string; }

// /**
//  * Map the AttributeType type to be a string.
//  */
// function mapAttributeToString(value: AttributeType): string {
//   switch(typeof value) {
//     case 'string':
//       return value;
//     case 'boolean':
//       return value ? 'true' : undefined;
//     default:
//       return value.toString();
//   }
// }

// /**
//  * Coerce an attribute to be an observable emitting the attribute name and value.
//  * @param name The attribute name
//  * @param attr The attribute or attribute observable.
//  */
// function attributeToStringAttribute(
//   name: string,
//   attr: AttributeType | Observable<AttributeType>,
// ): Observable<[string, string]> {
//   const attr$ = attr instanceof Observable ? attr : of(attr);
//   return attr$.pipe(
//     map(attributeType => [name, mapAttributeToString(attributeType)]),
//   );
// }

// /**
//  * Coerce the Attributes type to be an observable emitting the StringAttributes type.
//  */
// function attributesToStringAttributes(attrs: Attributes): Observable<StringAttributes> {
//   const attributeObservables = Object.keys(attrs).map(key => attributeToStringAttribute(key, attrs[key]));
//   return combineLatest(attributeObservables).pipe(
//     debounceTime(0),
//     map(atts => atts.reduce((result, [name, attributeString]) => {
//       result[name] = attributeString;
//       return result;
//     }, {} as StringAttributes)),
//   );
// }

// /**
//  * Update the attributes for an HTML element from two dictionaries containing the current attributes and new attributes.
//  */
// export function updateElementAttributes<T extends HTMLElement>(
//   el: T,
//   oldAttributes: StringAttributes,
//   newAttributes: StringAttributes
// ): T {
//   const diff = attributeDiffer(oldAttributes, newAttributes);
//   Object.keys(diff.updated).forEach(key => {
//     el.setAttribute(key, diff.updated[key]);
//   });
//   diff.removed.forEach(attr => el.removeAttribute(attr));
//   return el;
// }

// /**
//  * An observable operator to update the attributes on an RxFM component.
//  * @param attributesOrObservableAttrs A dictionary (or observable emitting a dictionary) of attribute names to
//  * attribute values. Attribute values may be strings, numbers, or booleans, or observables emitting these types.
//  */
// export function attributes<T extends HTMLElement, E>(
//   attributesOrObservableAttrs: Attributes | Observable<Attributes>
// ): ComponentOperatorOld<T, E> {
//   return (component: ComponentOld<T, E>): ComponentOld<T, E> =>
//     component.pipe(
//       switchMap(({ node, events }) => {
//         const attributesObservable = attributesOrObservableAttrs instanceof Observable // Coerce to observable.
//           ? attributesOrObservableAttrs
//           : of(attributesOrObservableAttrs);

//         let previousAttributes: StringAttributes = {};
//         return attributesObservable.pipe(
//           switchMap(attributesToStringAttributes), // Convert attributes to key to string object.
//           map(attrs => {
//             updateElementAttributes(node, previousAttributes, attrs); // Update element attributes.
//             previousAttributes = attrs; // Store previous attributes.
//             return { node, events };
//           }),
//           startWith({ node, events })
//         );
//       }),
//       distinctUntilKeysChanged()
//     );
// }
