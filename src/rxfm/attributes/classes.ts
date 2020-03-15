import { Observable, of, combineLatest } from 'rxjs';
import { ComponentOperator, Component } from '../components';
import { attributes } from './attributes';
import { map, debounceTime } from 'rxjs/operators';

export type ClassType = string | false | Observable<string | false | (string | false)[]>;

function classTypesToStringObservable(classTypes: ClassType[]): Observable<string> {

  const classStrings = classTypes.map(classType => classType instanceof Observable ? classType.pipe(
    map(stringOrArray => Array.isArray(stringOrArray) ? stringOrArray : [stringOrArray]),
  ) : of([classType]));

  return combineLatest(classStrings).pipe(
    map(stringArrayArray => {
      const classSet = new Set<string>();
      stringArrayArray.forEach(stringArray => stringArray.forEach(str => str && classSet.add(str)));
      return Array.from(classSet.values()).join(' ');
    }),
    debounceTime(0),
  )
}

export function classes<T extends HTMLElement, E>(
  ...classNames: ClassType[]
): ComponentOperator<T, E> {
  return (component: Component<T, E>) => component.pipe(
    attributes({
      class: classTypesToStringObservable(classNames),
    }),
  );
}
