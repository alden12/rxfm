import { Observable, of, combineLatest } from 'rxjs';
import { map, switchMap, startWith, debounceTime } from 'rxjs/operators';
import { attributeDiffer } from './attribute-differ';
import { Component, ComponentOperator } from '../components';
import { distinctUntilKeysChanged } from '../utils';

export type AttributeType = string | number | boolean;

export type Attributes = { [attr: string]: AttributeType | Observable<AttributeType>};

export interface StringAttributes { [attr: string]: string; }

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

function attributeToStringAttribute(
  name: string,
  attr: AttributeType | Observable<AttributeType>,
): Observable<[string, string]> {
  const attr$ = attr instanceof Observable ? attr : of(attr);
  return attr$.pipe(
    map(attributeType => [name, mapAttributeToString(attributeType)]),
  );
}

function attributesToStringAttributes(attrs: Attributes): Observable<StringAttributes> {
  const attributeObservables = Object.keys(attrs).map(key => attributeToStringAttribute(key, attrs[key]));
  return combineLatest(attributeObservables).pipe(
    debounceTime(0),
    map(atts => atts.reduce((result, [name, attributeString]) => {
      result[name] = attributeString;
      return result;
    }, {} as StringAttributes)),
  );
}

export function updateElementAttributes<T extends HTMLElement>(
  el: T,
  oldAttributes: StringAttributes,
  newAttributes: StringAttributes
): T {
  const diff = attributeDiffer(oldAttributes, newAttributes);
  Object.keys(diff.updated).forEach(key => {
    el.setAttribute(key, diff.updated[key]);
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
        const attributesObservable = attributesOrObservableAttrs instanceof Observable // Coerce to observable.
          ? attributesOrObservableAttrs
          : of(attributesOrObservableAttrs);

        let previousAttributes: StringAttributes = {};
        return attributesObservable.pipe(
          switchMap(attributesToStringAttributes), // Convert attributes to key to string object.
          map(attrs => {
            updateElementAttributes(node, previousAttributes, attrs); // Update element attributes.
            previousAttributes = attrs; // Store previous attributes.
            return { node, events };
          }),
          startWith({ node, events })
        );
      }),
      distinctUntilKeysChanged()
    );
}

// Would attribute funciton be needed if attribute types could be observable?
// export function attribute<T extends HTMLElement, E>(
//   attributeName: string,
//   value: AttributeType | Observable<AttributeType>,
// ): ComponentOperator<T, E>

// export function attribute<T extends HTMLElement, E, A>(
//   attributeName: string,
//   value: A | Observable<A>,
//   valueFunction: (val: A) => AttributeType // Is this still needed?
// ): ComponentOperator<T, E>

// export function attribute<T extends HTMLElement, E, A>(
//   attributeName: string,
//   value: A | AttributeType | Observable<A | AttributeType>,
//   valueFunction?: (val: A) => AttributeType
// ): ComponentOperator<T, E> {
//   const value$ = value instanceof Observable ? value : of(value);
//   const attributes$ = value$.pipe(
//     map(val => ({ [attributeName]: valueFunction? valueFunction(val as A) : val as AttributeType}))
//   );
//   return attributes(attributes$);
// }
