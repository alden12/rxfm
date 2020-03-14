import { Observable, of, combineLatest, merge, EMPTY } from 'rxjs';
import { map, switchMap, debounceTime, shareReplay, distinctUntilChanged, mapTo, switchAll, share } from 'rxjs/operators';
import { IComponent, Component, ComponentOperator } from '../components';
import { childDiffer } from './child-differ';
import { SHARE_REPLAY_CONFIG } from '../utils';

export type ChildComponent<E> =
  string | number | boolean | Observable<string | number | boolean | IComponent<Node, E> | IComponent<Node, E>[]>;

function coerceChildComponent<E>(
  childComponent: ChildComponent<E>,
): Observable<IComponent<Node, E>[]> {
  if (childComponent instanceof Observable) {
    let node: Text;
    return childComponent.pipe(
      map(child => {
        if (typeof child === "string" || typeof child === 'number' || typeof child === 'boolean') {
          node = node || document.createTextNode('');
          node.nodeValue = typeof child !== 'string' ? child.toString() : child;
          return [{ node, events: EMPTY }];
        } else if (child !== undefined && child !== null) {
          return Array.isArray(child) ? child : [child];
        }
        return null
      }),
    );
  } else if (typeof childComponent === 'string' || typeof childComponent === 'number' || typeof childComponent === 'boolean') {
    const content = typeof childComponent !== 'string' ? childComponent.toString() : childComponent;
    const node = document.createTextNode(content);
    return of([{ node, events: EMPTY }]);
  }
  return of(null);
}

function updateElementChildren<T extends HTMLElement>(
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

// tslint:disable: max-line-length
export function children<T extends HTMLElement, EV>(): ComponentOperator<T, EV>
export function children<T extends HTMLElement, EV, A = {}>(childA: ChildComponent<A>): ComponentOperator<T, EV, EV & A>
export function children<T extends HTMLElement, EV, A = {}, B = {}>(childA: ChildComponent<A>, childB: ChildComponent<B>): ComponentOperator<T, EV, EV & A & B>
export function children<T extends HTMLElement, EV, A = {}, B = {}, C = {}>(childA: ChildComponent<A>, childB: ChildComponent<B>, childC: ChildComponent<C>): ComponentOperator<T, EV, EV & A & B & C>
export function children<T extends HTMLElement, EV, A = {}, B = {}, C = {}, D = {}>(childA: ChildComponent<A>, childB: ChildComponent<B>, childC: ChildComponent<C>, childD: ChildComponent<D>): ComponentOperator<T, EV, EV & A & B & C & D>
export function children<T extends HTMLElement, EV, A = {}, B = {}, C = {}, D = {}, E = {}>(childA: ChildComponent<A>, childB: ChildComponent<B>, childC: ChildComponent<C>, childD: ChildComponent<D>, childE: ChildComponent<E>): ComponentOperator<T, EV, EV & A & B & C & D & E>
export function children<T extends HTMLElement, EV, A = {}, B = {}, C = {}, D = {}, E = {}, F = {}>(childA: ChildComponent<A>, childB: ChildComponent<B>, childC: ChildComponent<C>, childD: ChildComponent<D>, childE: ChildComponent<E>, childF: ChildComponent<F>): ComponentOperator<T, EV, EV & A & B & C & D & E & F>
export function children<T extends HTMLElement, EV, A = {}, B = {}, C = {}, D = {}, E = {}, F = {}, G = {}>(childA: ChildComponent<A>, childB: ChildComponent<B>, childC: ChildComponent<C>, childD: ChildComponent<D>, childE: ChildComponent<E>, childF: ChildComponent<F>, childG: ChildComponent<G>): ComponentOperator<T, EV, EV & A & B & C & D & E & F & G>
export function children<T extends HTMLElement, EV, A = {}, B = {}, C = {}, D = {}, E = {}, F = {}, G = {}, H = {}>(childA: ChildComponent<A>, childB: ChildComponent<B>, childC: ChildComponent<C>, childD: ChildComponent<D>, childE: ChildComponent<E>, childF: ChildComponent<F>, childG: ChildComponent<G>, childH: ChildComponent<H>): ComponentOperator<T, EV, EV & A & B & C & D & E & F & G & H>
export function children<T extends HTMLElement, EV, A = {}, B = {}, C = {}, D = {}, E = {}, F = {}, G = {}, H = {}, I = {}>(childA: ChildComponent<A>, childB: ChildComponent<B>, childC: ChildComponent<C>, childD: ChildComponent<D>, childE: ChildComponent<E>, childF: ChildComponent<F>, childG: ChildComponent<G>, childH: ChildComponent<H>, childI: ChildComponent<I>): ComponentOperator<T, EV, EV & A & B & C & D & E & F & G & H & I>
// tslint:enable: max-line-length

export function children<T extends HTMLElement, E>(
  ...childComponents: ChildComponent<any>[]
): ComponentOperator<T, E, any> {
  return (component: Component<T, E>) => component.pipe(
    switchMap(({ node, events }) => {

      const children$ = combineLatest<IComponent<Node, any>[][]>(
        ...childComponents.map(coerceChildComponent)
      ).pipe(
        debounceTime(0),
        map(childrenOrNull => childrenOrNull.filter(child => child !== null)),
        map(unflattened => unflattened.reduce<IComponent<Node, any>[]>((flat, comps) => flat.concat(comps), [])),
        shareReplay(SHARE_REPLAY_CONFIG),
      );

      const events$ = children$.pipe(
        map(components =>
          merge<any>(
            ...(events ? [events] : []),
            ...components.map(comp => comp.events).filter(ev => ev !== undefined),
          )
        ),
        switchAll(),
        share(),
      );

      let previousNodes: Node[] = [];
      return children$.pipe(
        map(components => {
          const nodes = components.map(comp => comp.node);
          updateElementChildren(node, previousNodes, nodes);
          previousNodes = nodes;
          return node;
        }),
        distinctUntilChanged(),
        mapTo({ node, events: events$ }),
        shareReplay(SHARE_REPLAY_CONFIG), // Is this share needed?
      );
    }),
  );
}
