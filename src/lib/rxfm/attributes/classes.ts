import { Observable, of, combineLatest } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { ComponentOperator, ElementType, ComponentObservable } from '../components';
import { attribute } from './attributes';
import { EventType } from '../events';
import { NullLike, coerceToArray } from '../utils';

export type ClassSingle = string | NullLike;

/**
 * The possible types to pass as a CSS class name to the 'classes' operator.
 */
export type ClassType = ClassSingle | Observable<ClassSingle | ClassSingle[]>;

/**
 * Coerce an array of ClassType types to be an observable emitting a string of CSS class names.
 */
function classTypesToStringObservable(classTypes: ClassType[]): Observable<string> {

  const classStrings = classTypes.map(classType => classType instanceof Observable ? classType.pipe(
    map(coerceToArray),
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
export function classes<T extends ElementType, E extends EventType>(
  ...classNames: ClassType[]
): ComponentOperator<T, E> {
  return (input: ComponentObservable<T, E>) => input.pipe(
    attribute('class', classTypesToStringObservable(classNames)),
  );
}
