import { Observable, of } from 'rxjs';
import { Component, ComponentOperator } from '../components';
import { switchMap, map, startWith } from 'rxjs/operators';
import { distinctUntilKeysChanged } from '../utils';

export function styles<T extends HTMLElement, E>(
  styles: Partial<CSSStyleDeclaration> | Observable<Partial<CSSStyleDeclaration>>
): ComponentOperator<T, E> {
  return (component: Component<T, E>) =>
    component.pipe(
      switchMap(({ node, events }) => {
        const stylesObservable = styles instanceof Observable ? styles : of(styles);
        let previousStyles: Partial<CSSStyleDeclaration> = {};
        return stylesObservable.pipe(
          map(style => {
            Object.keys(style)
              .filter(key => style[key] !== previousStyles[key])
              .forEach(key => (node.style[key] = style[key] || null));
            previousStyles = { ...previousStyles, ...style };
            return { node, events };
          }),
          startWith({ node, events })
        );
      }),
      distinctUntilKeysChanged(),
    );
}
