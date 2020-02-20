import { Observable, of, combineLatest, merge } from 'rxjs';
import { map, switchMap, debounceTime, shareReplay, distinctUntilChanged, mapTo, switchAll, share } from 'rxjs/operators';
import { IComponent, Component, ComponentOperator, SHARE_REPLAY_CONFIG } from '../';
import { childDiffer } from './child-differ';

export type ChildComponent<E> = string | number | Observable<string | number | IComponent<Node, E> | IComponent<Node, E>[]>;

export function coerceChildComponent<E>(
  childComponent: ChildComponent<E>,
): Observable<IComponent<Node, E>[]> {
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

export function children_<T extends Node, E>(): ComponentOperator<T, E>
export function children_<T extends Node, E, A>(childA: ChildComponent<A>): ComponentOperator<T, E, E & A>
export function children_<T extends Node, E, A, B>(childA: ChildComponent<A>, childB: ChildComponent<B>): ComponentOperator<T, E, E & A & B>
export function children_<T extends Node, E, A, B, C>(childA: ChildComponent<A>, childB: ChildComponent<B>, childC: ChildComponent<C>): ComponentOperator<T, E, E & A & B & C>
export function children_<T extends Node, E, O>(
  ...children: ChildComponent<any>[]
): ComponentOperator<T, E, O> {
  return (component: Component<T, E>) => undefined;
}

function test<T extends any[]>(
  ...children: ChildComponent<T>[]
) {}

// TODO: Children must take overloads to maintain type chain
export function children<T extends HTMLElement, E>(
  ...children: ChildComponent<E>[] // Is this valid?
): ComponentOperator<T, E> {
  return (component: Component<T, E>): Component<T, E> =>
    component.pipe(
      switchMap(({ node, events }) => {

        const children$ = combineLatest<IComponent<Node, E>[][]>(
          ...children.map(coerceChildComponent)
        ).pipe(
          debounceTime(0),
          map(unflattened => unflattened.reduce<IComponent<Node, E>[]>((flat, comps) => flat.concat(comps), [])),
          shareReplay(SHARE_REPLAY_CONFIG),
        );

        const events$ = children$.pipe(
          map(components =>
            merge<E>(
              ...(events ? [events] : []),
              ...components.map(comp => comp.events).filter(ev => ev !== undefined),
            )
          ),
          switchAll(),
          share(),
        );

        let previousNodes = [];
        return children$.pipe(
          map(components => {
            const nodes = components.map(comp => comp.node);
            updateElementChildren(node, previousNodes, nodes);
            previousNodes = nodes;
            return node;
          }),
          distinctUntilChanged(),
          mapTo({ node, events: events$ }),
          shareReplay(SHARE_REPLAY_CONFIG),
        );
      }),
    );
}
