import { Observable, of, combineLatest } from 'rxjs';
import { ComponentOperatorOld, ComponentOld } from '../components';
import { attributes } from './attributes';
import { map, debounceTime } from 'rxjs/operators';

/**
 * The possible types to pass as a CSS class name to the 'classes' operator.
 */
export type ClassType = string | false | Observable<string | false | (string | false)[]>;

/**
 * Coerce an array of ClassType types to be an observable emitting a string of CSS class names.
 */
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

/**
 * An observable operator to manage the CSS classes on an RxFM component.
 * @param classNames A spread array of class names. These may either be of type string, string observable or string
 * array observable. If the class name value is falsy (false, undefined, null , 0) The class will be removed.
 */
export function classes<T extends HTMLElement, E>(
  ...classNames: ClassType[]
): ComponentOperatorOld<T, E> {
  return (component: ComponentOld<T, E>) => component.pipe(
    attributes({
      class: classTypesToStringObservable(classNames),
    }),
  );
}
