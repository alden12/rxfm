import { Observable, of, combineLatest } from 'rxjs';
import { map, debounceTime, startWith, tap } from 'rxjs/operators';
import { ComponentOperator, ElementType, componentOperator } from '../components';
import { elementMetadataService } from '../metadata-service';
import { NullLike, coerceToArray, flatten } from '../utils';

export type ClassSingle = string | NullLike;

/**
 * The possible types to pass as a CSS class name to the 'classes' operator.
 */
export type ClassType = ClassSingle | Observable<ClassSingle | ClassSingle[]>;

/**
 * Coerce an array of ClassType types to be an observable emitting a string of CSS class names.
 */
function classTypesToSetObservable(classTypes: ClassType[]): Observable<Set<string>> {
  const classStringsObservables = classTypes.map(classType => classType instanceof Observable ? classType.pipe(
    map(coerceToArray),
  ) : of([classType]));

  return combineLatest(classStringsObservables).pipe(
    debounceTime(0),
    map(stringArrayArray => new Set(flatten(stringArrayArray).filter(className => Boolean(className)) as string[])),
  )
}

/**
 * An observable operator to manage the CSS classes on an RxFM component.
 * @param classNames A spread array of class names. These may either be of type string, string observable or string
 * array observable. If the class name value is falsy (false, undefined, null , 0) The class will be removed.
 */
export function classes<T extends ElementType>(
  ...classNames: ClassType[]
): ComponentOperator<T> {
  return componentOperator(element => {
    const symbol = Symbol('Classes Operator');

    return classTypesToSetObservable(classNames).pipe(
      startWith(new Set<string>()),
      tap(newClassSet => {
        const currentClassSet = elementMetadataService.getClassSet(element, symbol);

        const added = currentClassSet ?
          Array.from(newClassSet).filter(className => !currentClassSet.has(className)) :
          Array.from(newClassSet);
        element.classList.add(...added);

        const removed = currentClassSet ? Array.from(currentClassSet).filter(className => {
          return !newClassSet.has(className) && elementMetadataService.canRemoveClass(element, symbol, className);
        }) : [];
        element.classList.remove(...removed);

        elementMetadataService.setClassSet(element, symbol, newClassSet);
      }),
    );
  });
}
