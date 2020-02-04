import { Observable, of, combineLatest } from 'rxjs';
import { map, switchMap, debounceTime } from 'rxjs/operators';
import { IComponent, Component } from '../component';
import { childDiffer } from './child-differ';

export type ChildComponent<E = undefined> = string | number | Observable<string | number | IComponent<any, E> | IComponent<any, E>[]>;

export function coerceChildComponent<E = undefined>(
  childComponent: ChildComponent<E>,
): Observable<IComponent<any, E>[]> {
  if (childComponent instanceof Observable) {
    let node: Text;
    return childComponent.pipe(
      map(child => {
        if (typeof child === "string" || typeof child === 'number') {
          node = node || document.createTextNode('');
          node.nodeValue = typeof child === 'number' ? child.toString() : child;
          return [{ node }];
        }
        return Array.isArray(child) ? child : [child];
      }),
    );
  } else {
    const content = typeof childComponent === 'number' ? childComponent.toString() : childComponent;
    const node = document.createTextNode(content);
    return of([{ node }]);
  }
}

export function updateElementChildren<T extends HTMLElement>(
  el: T,
  previousChildren: Node[],
  newChildren: Node[]
): T {
  const diff = childDiffer(previousChildren, newChildren);

  diff.removed.forEach(node => el.removeChild(node));
  el.append(
    ...diff.updated
      .filter(update => !update.insertBefore)
      .map(update => update.node)
  );
  diff.updated
    .filter(update => update.insertBefore)
    .forEach(update => el.insertBefore(update.node, update.insertBefore));

  return el;
}

export function children<T extends HTMLElement, E = undefined>(
  ...children: ChildComponent<E>[]
): (component: Component<T, E>) => Component<T, E> {
  return (component: Component<T, E>): Component<T, E> =>
    component.pipe(
      switchMap(({ node, events }) => {
        const componentArrays$ = children.map(child => coerceChildComponent(child));
        const unflattenedComponents$: Observable<Component<any, E>[][]> = combineLatest(
          ...componentArrays$
        ).pipe(debounceTime(0));
        const components$ = unflattenedComponents$.pipe(
          map(unflattened => unflattened.reduce<Node[]>((flat, nodeArr) => flat.concat(nodeArr), [])),
        );
        let previousNodes: Node[] = [];
        return components$.pipe(
          map(nodes => {
            updateElementChildren(el, previousNodes, nodes);
            previousNodes = nodes;
            return el;
          }),
          startWith(el)
        );
      }),
      distinctUntilChanged()
    );
}
