import { Observable } from 'rxjs';
import { attribute } from './index';
import { ComponentOperator } from '../component';

export function classes<T extends HTMLElement, E>(
  classes: string | string[] | Observable<string | string[]>
): ComponentOperator<T, E> {
  return attribute(
      'class',
      classes,
      (val: string | string[]) => (Array.isArray(val) ? val : [val]).join(" ")
  );
}
