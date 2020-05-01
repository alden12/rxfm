import { Observable, of, combineLatest } from 'rxjs';
import { map, switchMap, startWith, debounceTime } from 'rxjs/operators';
import { attributeDiffer } from './attribute-differ';
import { ComponentOld, ComponentOperatorOld } from '../components';
import { distinctUntilKeysChanged } from '../utils';

/**
 * Allowed types for attribute values used in the 'attributes' operator.
 */
export type AttributeType = string | number | boolean;

/**
 * A dictionary of attributes or observable attributes to be used in the 'attributes' operator.
 */
export type Attributes = { [attr: string]: AttributeType | Observable<AttributeType>};

/**
 * A dictionary of attribute names to string values.
 */
export interface StringAttributes { [attr: string]: string; }

/**
 * Map the AttributeType type to be a string.
 */
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

/**
 * Coerce an attribute to be an observable emitting the attribute name and value.
 * @param name The attribute name
 * @param attr The attribute or attribute observable.
 */
function attributeToStringAttribute(
  name: string,
  attr: AttributeType | Observable<AttributeType>,
): Observable<[string, string]> {
  const attr$ = attr instanceof Observable ? attr : of(attr);
  return attr$.pipe(
    map(attributeType => [name, mapAttributeToString(attributeType)]),
  );
}

/**
 * Coerce the Attributes type to be an observable emitting the StringAttributes type.
 */
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

/**
 * Update the attributes for an HTML element from two dictionaries containing the current attributes and new attributes.
 */
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

/**
 * An observable operator to update the attributes on an RxFM component.
 * @param attributesOrObservableAttrs A dictionary (or observable emitting a dictionary) of attribute names to
 * attribute values. Attribute values may be strings, numbers, or booleans, or observables emitting these types.
 */
export function attributes<T extends HTMLElement, E>(
  attributesOrObservableAttrs: Attributes | Observable<Attributes>
): ComponentOperatorOld<T, E> {
  return (component: ComponentOld<T, E>): ComponentOld<T, E> =>
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
