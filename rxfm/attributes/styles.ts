
export function styles<T extends HTMLElement>(
  styles:
    | Partial<CSSStyleDeclaration>
    | Observable<Partial<CSSStyleDeclaration>>
): (node: Observable<T>) => Observable<T> {
  return (node: Observable<T>) =>
    node.pipe(
      switchMap(el => {
        const stylesObservable =
          styles instanceof Observable ? styles : of(styles);
        let previousStyles: Partial<CSSStyleDeclaration> = {};
        return stylesObservable.pipe(
          map(style => {
            Object.keys(style)
              .filter(key => style[key] !== previousStyles[key])
              .forEach(key => (el.style[key] = style[key] || null));
            previousStyles = { ...previousStyles, ...style };
            return el;
          }),
          startWith(el)
        );
      }),
      distinctUntilChanged()
    );
}
