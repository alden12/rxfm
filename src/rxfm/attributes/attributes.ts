import { Observable, of } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { attributeDiffer } from './attribute-differ';
import { Component, ComponentOperator } from '../components';
import { distinctUntilKeysChanged } from '../utils';

export type AttributeType = string | number | boolean; // Add observable to attribute type definition?

export type Attributes = { [attr: string]: AttributeType};

function mapAttributeToString(value: AttributeType): string {
  switch(typeof value) {
    case 'string':
      return value;
    case 'boolean':
      return value ? 'true' : undefined;
    default:
      return value.toString();
  }
}

export function updateElementAttributes<T extends HTMLElement>(
  el: T,
  oldAttributes: Attributes,
  newAttributes: Attributes
): T {
  const diff = attributeDiffer(oldAttributes, newAttributes);
  Object.keys(diff.updated).forEach(key => {
    el.setAttribute(key, mapAttributeToString(diff.updated[key]));
  });
  diff.removed.forEach(attr => el.removeAttribute(attr));
  return el;
}

export function attributes<T extends HTMLElement, E>(
  attributesOrObservableAttrs: Attributes | Observable<Attributes>
): ComponentOperator<T, E> {
  return (component: Component<T, E>): Component<T, E> =>
    component.pipe(
      switchMap(({ node, events }) => {
        const attributesObservable = attributesOrObservableAttrs instanceof Observable
          ? attributesOrObservableAttrs
          : of(attributesOrObservableAttrs);
        let previousAttributes: Attributes = {};
        return attributesObservable.pipe(
          map(attrs => {
            updateElementAttributes(node, previousAttributes, attrs);
            previousAttributes = attrs;
            return { node, events };
          }),
          startWith({ node, events })
        );
      }),
      distinctUntilKeysChanged()
    );
}

// Would attribute funciton be needed if attribute types could be observable?
export function attribute<T extends HTMLElement, E>(
  attributeName: string,
  value: AttributeType | Observable<AttributeType>,
): ComponentOperator<T, E>

export function attribute<T extends HTMLElement, E, A>(
  attributeName: string,
  value: A | Observable<A>,
  valueFunction: (val: A) => AttributeType // Is this still needed?
): ComponentOperator<T, E>

export function attribute<T extends HTMLElement, E, A>(
  attributeName: string,
  value: A | AttributeType | Observable<A | AttributeType>,
  valueFunction?: (val: A) => AttributeType
): ComponentOperator<T, E> {
  const value$ = value instanceof Observable ? value : of(value);
  const attributes$ = value$.pipe(
    map(val => ({ [attributeName]: valueFunction? valueFunction(val as A) : val as AttributeType}))
  );
  return attributes(attributes$);
}
