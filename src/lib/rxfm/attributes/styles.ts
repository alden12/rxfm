import { Observable, of } from 'rxjs';
import { ComponentOld, ComponentOperatorOld } from '../components';
import { switchMap, map, startWith } from 'rxjs/operators';
import { distinctUntilKeysChanged } from '../utils';

// TODO: Add option to provide observable values inside object.
/**
 * An observable operator to update the styles on an RxFM component.
 * @param stylesOrObservableStyles A dictionary (or observable emitting a dictionary) of style names to values.
 */
export function styles<T extends HTMLElement, E>(
  stylesOrObservableStyles: Partial<CSSStyleDeclaration> | Observable<Partial<CSSStyleDeclaration>>
): ComponentOperatorOld<T, E> {
  return (component: ComponentOld<T, E>) =>
    component.pipe(
      switchMap(({ node, events }) => {
        const stylesObservable = stylesOrObservableStyles instanceof Observable // Coerce to observable.
          ? stylesOrObservableStyles
          : of(stylesOrObservableStyles);
        let previousStyles: Partial<CSSStyleDeclaration> = {}; // Keep track of old styles.
        return stylesObservable.pipe(
          map(style => {
            Object.keys(style) // Loop through new styles an update element with any changed style values.
              .filter(key => style[key] !== previousStyles[key])
              .forEach(key => (node.style[key] = style[key] || null));
            previousStyles = { ...previousStyles, ...style }; // Store current state.
            return { node, events };
          }),
          startWith({ node, events })
        );
      }),
      distinctUntilKeysChanged(),
    );
}
