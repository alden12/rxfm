import { Observable, of } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { attributeDiffer } from './attribute-differ';
import { Component, ComponentOperator } from '../components';
import { distinctUntilKeysChanged } from '../utils';

export type Attributes = { [attr: string]: string };

export function updateElementAttributes<T extends HTMLElement>(
  el: T,
  oldAttributes: Attributes,
  newAttributes: Attributes
): T {
  const diff = attributeDiffer(oldAttributes, newAttributes);
  Object.keys(diff.updated).forEach(key => {
    el.setAttribute(key, diff.updated[key]);
  });
  diff.removed.forEach(attr => el.removeAttribute(attr));
  return el;
}

export function attributes<T extends HTMLElement, E>(
  attributes: Attributes | Observable<Attributes>
): ComponentOperator<T, E> {
  return (component: Component<T, E>): Component<T, E> =>
    component.pipe(
      switchMap(({ node, events }) => {
        const attributesObservable = attributes instanceof Observable ? attributes : of(attributes);
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

export function attribute<T extends HTMLElement, E, A>(
  attribute: string,
  value: A | Observable<A>,
  valueFunction: (val: A) => string
): ComponentOperator<T, E> {
  const value$ = value instanceof Observable ? value : of(value);
  const attributes$ = value$.pipe(
    map(val => ({ [attribute]: valueFunction(val) }))
  );
  return attributes(attributes$);
}
