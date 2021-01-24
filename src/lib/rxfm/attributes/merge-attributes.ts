import { combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassType, IAttributes, Styles, StaticStyles } from '.';
import { coerceToArray, filterObject, NullLike } from '../utils';
import { StyleKeys } from './styles';
import { EventOperators } from '../components/creator';

export function mergeClasses(
  secondaryClasses: ClassType | ClassType[] | NullLike,
  primaryClasses: ClassType | ClassType[] | NullLike,
): ClassType[] {
  return [
    ...(primaryClasses ? coerceToArray(primaryClasses) : []),
    ...(secondaryClasses ? coerceToArray(secondaryClasses) : [])
  ];
}

function getStylesObservable(
  styles: Styles | Observable<StaticStyles> | undefined,
): Observable<StaticStyles> {
  if (!styles) {
    return of({} as StaticStyles);
  } else if (styles instanceof Observable) {
    return styles;
  } else if (Object.keys(styles).some(key => styles[key] instanceof Observable)) {

    const staticStyles = filterObject(styles, value => !(value instanceof Observable)) as StaticStyles;
    const styleObservables = Object.keys(styles)
      .filter(key => styles[key] instanceof Observable)
      .map((key: StyleKeys) => (styles[key] as Observable<string>).pipe(
        map(value => ({ key, value })),
      ));

    return combineLatest(styleObservables).pipe(
      map(styleEntries => styleEntries.reduce((result, { key, value }) => {
        result[key] = value;
        return result;
      }, { ...staticStyles })),
    );
  } else {
    return of(styles as StaticStyles);
  }
}

export function mergeStyles(
  secondaryStyles: Styles | Observable<StaticStyles> | undefined,
  primaryStyles: Styles | Observable<StaticStyles> | undefined,
): Observable<StaticStyles> {
  const primary = getStylesObservable(primaryStyles);
  const secondary = getStylesObservable(secondaryStyles);
  return combineLatest([primary, secondary]).pipe(
    map(([pri, sec]) => ({ ...sec, ...pri })),
  );
}

export function mergeAttributes<AE, A extends EventOperators<AE>>(
  secondaryAttributes: IAttributes,
  primaryAttributes: A & IAttributes,
): A & IAttributes {
  return {
    ...secondaryAttributes,
    ...primaryAttributes,
    class: mergeClasses(primaryAttributes.class, secondaryAttributes.class),
    style: mergeStyles(primaryAttributes.style, secondaryAttributes.style),
  };
}
