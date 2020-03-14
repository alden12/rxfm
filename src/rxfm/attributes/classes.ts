import { Observable } from 'rxjs';
import { attribute } from './attributes';
import { ComponentOperator } from '../components';

export type ClassType = string | Observable<string | string[]>;

// export function classes<T extends HTMLElement, E> (
//   ...classNames: ClassType[]
// ): ComponentOperator<T, E> {
//   return ;
// }

export function classes<T extends HTMLElement, E>(
  classStringsOrObservables: string | string[] | Observable<string | string[]>
): ComponentOperator<T, E> {
  return attribute(
      'class',
      classStringsOrObservables,
      (val: string | string[]) => (Array.isArray(val) ? val : [val]).join(" ")
  );
}

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