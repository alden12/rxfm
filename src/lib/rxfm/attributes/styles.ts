import { Observable } from 'rxjs';
import { ElementType, ComponentOperator, Component } from '../components';
import { switchMap, tap, mapTo, distinctUntilChanged, startWith } from 'rxjs/operators';
import { coerceToObservable, NullLike } from '../utils';
import { EventType } from '../events';

export type StyleKeys = Extract<keyof CSSStyleDeclaration, string>;

export type StyleType<K extends StyleKeys> = CSSStyleDeclaration[K] | NullLike;

export type Style<K extends StyleKeys> = StyleType<K> | Observable<StyleType<K>>

export function style<T extends ElementType, E extends EventType, K extends StyleKeys>(
  name: K,
  value: Style<K>,
): ComponentOperator<T, E> {
  return (input: Component<T, E>) => input.pipe(
    switchMap(component => coerceToObservable(value).pipe(
      distinctUntilChanged(),
      tap(val => val ? component.element.style[name] = val : component.element.style[name] = null as any),
      mapTo(component),
    )),
    distinctUntilChanged(),
  );
}

export type Styles = {
  [K in StyleKeys]?: Style<K>;
};

export type StylesOrNull = { [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] | null }

// /**
//  * An observable operator to update the styles on an RxFM component.
//  * @param stylesOrObservableStyles A dictionary (or observable emitting a dictionary) of style names to values.
//  */
export function styles<T extends ElementType, E extends EventType>(
  stylesDict: Styles | Observable<StylesOrNull>,
): ComponentOperator<T, E> {
  return (input: Component<T, E>) => {
    if (stylesDict instanceof Observable) {

      let previousStyles: StylesOrNull = {};
      return input.pipe(
        switchMap(component => stylesDict.pipe(
          tap(dict => {
            Object.keys(dict).forEach(key => {
              if (dict[key] !== previousStyles[key]) {
                component.element.style[key] = dict[key];
              }
            });
            previousStyles = dict;
          }),
          mapTo(component),
          startWith(component),
          distinctUntilChanged(),
        ))
      );
    } else {

      return Object.keys(stylesDict).reduce((component, key: StyleKeys) => component.pipe(
        style(key, stylesDict[key]),
      ), input);
    }
  }
}
