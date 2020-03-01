import { Observable } from 'rxjs';
import { attribute } from './attributes';
import { ComponentOperator } from '../components';

export function classes<T extends HTMLElement, E>(
  classStringsOrObservables: string | string[] | Observable<string | string[]> // TODO: Convert to use spread operator
): ComponentOperator<T, E> {
  return attribute(
      'class',
      classStringsOrObservables,
      (val: string | string[]) => (Array.isArray(val) ? val : [val]).join(" ")
  );
}
