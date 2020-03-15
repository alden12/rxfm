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
