import { Observable, of, combineLatest } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { ComponentOperator, ElementType, componentOperator, Component } from '../components';
import { operatorIsolationService } from '../operator-isolation-service';
import { NullLike, coerceToArray, flatten } from '../utils';

/**
 * A CSS class name string or null-like to signify removed.
 */
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
    map(classNames => coerceToArray(classNames).filter(Boolean) as string[]),
    map(classNames => flatten(classNames.map(name => name.split(' ').filter(Boolean)))),
  ) : of(classType ? classType.split(' ').filter(Boolean) : []));

  return combineLatest(classStringsObservables).pipe(
    map(stringArrayArray => new Set(flatten(stringArrayArray) as string[])),
  );
}

/**
 * Determine whether or not an instance of the classes operator may remove a specific class name from an element.
 */
function canRemoveClass(
  symbol: symbol,
  className: string,
  classesMap: Map<symbol, Set<string>>,
): boolean {
  return !Array.from(classesMap.entries()).some(([blockSymbol, classSet]) => {
    if (blockSymbol !== symbol) {
      return classSet.has(className);
    }
    return false;
  });
}

/**
 * An observable operator to manage the CSS classes on an RxFM component.
 * @param classNames A spread array of class names, or class names as a template strings array.
 * These may either be of type string, string observable or string array observable.
 * If the class name value is falsy (false, undefined, null , 0) The class will be removed.
 */
export function classes<T extends ElementType>(
  ...classNames: ClassType[]
): ComponentOperator<T>;
// TODO: Replace return type with ComponentOperator once TS tagged template operator type inference is fixed.
export function classes(
  templateStrings: TemplateStringsArray,
  ...componentChildren: ClassType[]
): <T extends ElementType>(component: Component<T>) => Component<T>;
export function classes<T extends ElementType>(
  stringsOrFirstClassName: TemplateStringsArray | ClassType, ...otherClassNames: ClassType[]
): ComponentOperator<T> {
  return componentOperator(element => {
    const symbol = Symbol('Classes Operator');

    let classNames: ClassType[] = [];
    if (Array.isArray(stringsOrFirstClassName)) {
      classNames = (stringsOrFirstClassName as TemplateStringsArray)
        .reduce<ClassType[]>((acc, str, i) => {
          acc.push(str);
          if (otherClassNames[i]) acc.push(otherClassNames[i]);
          return acc;
        }, []);
    } else {
      classNames = [stringsOrFirstClassName as ClassType, ...otherClassNames];
    }

    return classTypesToSetObservable(classNames).pipe(
      startWith(new Set<string>()),
      tap(newClassSet => {
        const currentClassSet = operatorIsolationService.getClassesMap(element).get(symbol);

        const added = currentClassSet ?
          Array.from(newClassSet).filter(className => !currentClassSet.has(className)) :
          Array.from(newClassSet);
        element.classList.add(...added);

        const removed = currentClassSet ? Array.from(currentClassSet).filter(className => {
          return !newClassSet.has(className) &&
            canRemoveClass(symbol, className, operatorIsolationService.getClassesMap(element));
        }) : [];
        element.classList.remove(...removed);

        operatorIsolationService.getClassesMap(element).set(symbol, newClassSet);
      }),
    );
  });
}
