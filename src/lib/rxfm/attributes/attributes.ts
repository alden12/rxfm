import { Observable, of } from 'rxjs';
import { coerceToArray } from '../utils';
import { ElementType, ComponentOperator, ComponentObservable, EventType } from '../components';
import { HTMLAttributes } from './html';
import { SVGAttributes } from './svg';
import { switchMap, mapTo, distinctUntilChanged, tap, startWith } from 'rxjs/operators';
import { styles, Styles, StylesOrNull } from './styles';
import { classes, ClassType } from './classes';

export type TypeOrObservable<T> = T | Observable<T>;

export interface SpecialAttributes {
  class?: ClassType | ClassType[];
  style?: Styles | Observable<StylesOrNull>
}

// /**
//  * Allowed types for attribute values used in the 'attributes' operator.
//  */
export type AttributeType = string | boolean | number;

// /**
//  * A dictionary of attributes or observable attributes to be used in the 'attributes' operator.
//  */
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

// /**
//  * An observable operator to update the attributes on an RxFM component.
//  * @param attributesOrObservableAttrs A dictionary (or observable emitting a dictionary) of attribute names to
//  * attribute values. Attribute values may be strings, numbers, or booleans, or observables emitting these types.
//  */
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
