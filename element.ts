import { of, interval, Observable, combineLatest, fromEvent } from 'rxjs'; 
import { scan, map, distinctUntilChanged, debounceTime, switchMap, shareReplay, tap, share, filter, startWith } from 'rxjs/operators';

// TODO: Allow string input.
export function text(text: Observable<string> | string): Observable<Text> {
  const textObservable = typeof text === 'string' ? of(text) : text;
  return textObservable.pipe(
    scan((textNode, content) => {
      textNode.nodeValue = content;
      return textNode;
    }, document.createTextNode('')),
    distinctUntilChanged(),
  );
}

export interface INodeUpdate {
  node: Node;
  insertBefore?: Node;
}

export interface IChildDiff {
  updated: INodeUpdate[];
  removed: Node[];
}

export function childDiffer(oldChildren: Node[], newChildren: Node[]): IChildDiff {
  const oldSet = new Set(oldChildren);
  const newSet = new Set(newChildren);

  const remainingOldOrder = oldChildren.filter(node => newSet.has(node));
  const remainingNewOrder = newChildren.filter(node => oldSet.has(node));

  const orderUnchanged = remainingNewOrder.every((node, i) => remainingOldOrder[i] === node);

  let unchangedNodes: Set<Node>;
  if (orderUnchanged) {
    unchangedNodes = new Set(remainingNewOrder);
  } else {
    const oldNodeAndNext = new Map(
      remainingOldOrder.map((node, i) => [node, remainingOldOrder[i + 1]]),
    );
    const newElementesAndIndex = new Map(
      remainingNewOrder.map((node, i) => [node, i]),
    );

    const reordered = new Set(
      remainingNewOrder.filter((node, i) => {
        const oldNext = oldNodeAndNext.get(node);
        const newIndexOfNext = newElementesAndIndex.get(oldNext) || Infinity;
        return newIndexOfNext < i;
      })
    );

    unchangedNodes = new Set(
      newChildren.filter(node => oldSet.has(node) && !reordered.has(node)),
    );
  }

  let insertBefore: Node;
  const updated: INodeUpdate[] = [];
  for (let i = newChildren.length - 1; i >= 0; i--) {
    const node = newChildren[i];
    if (unchangedNodes.has(node)) {
      insertBefore = node;
    } else {
      updated.push({ node, insertBefore });
    }
  }
  updated.reverse();

  const removed = oldChildren.filter(child => !newSet.has(child));

  return { updated, removed };
}

export interface IAction<T, P> {
  type: T;
  payload: P;
}

export type Actions<T> = { [K in keyof T]: IAction<K, T[K]> };

export type Action<T> = Observable<Actions<T>[keyof T]>;

export type Outputs<T> = { [K in keyof T]: Observable<T[K]> };

export interface IElement<T extends Node, O = {}, A = {}> {
  node: Observable<T>;
  outputs?: Outputs<O>;
  actions?: Action<A>;
}

export type Children<T extends Node, A> =
  // string
  // | Observable<string>
  // | Observable<A>
  | IElement<Node, any, A>[]
  | Observable<IElement<Node, any, A>[]>
  | ((el: T) => IElement<Node, any, A>[])
  | ((el: T) => Observable<IElement<Node, any, A>[]>)
  ;

// export interface IElementOutput<T> {
//   outputs: Outputs<T>;
// }

// export interface IElementActions<T> {
//   actions?: Action<T>;
// }

// TODO: Attributes.

export function element<K extends keyof HTMLElementTagNameMap, O, A>(
  tagName: K,
  children: Children<HTMLElementTagNameMap[K], Partial<A>>,
): IElement<HTMLElementTagNameMap[K], O, A> {
// export function element<K extends keyof HTMLElementTagNameMap>(tagName: K, children: Children): Observable<HTMLElementTagNameMap[K]> {

  const el = document.createElement(tagName);
  // const childNodes = children.map(el => el.node);
  const childrenObservable = typeof children === 'function' ? children(el) : children;
  const childrenArrayObservable = Array.isArray(childrenObservable) ? of(childrenObservable) : childrenObservable;
  const childrenArray = childrenArrayObservable.pipe(
    map(els => els.map(el => el.node)),
    map(nodes => nodes.filter(el => el)),
    switchMap(nodes => combineLatest<Node[]>(...nodes)),
    map(nodes => nodes.filter(node => node)),
    debounceTime(0),
  );

  const node = childrenArray.pipe(
    map(children => {
      const diff = childDiffer(Array.from(el.childNodes.values()), children);
      diff.removed.forEach(node => el.removeChild(node));
      el.append(...diff.updated.filter(update => !update.insertBefore).map(update => update.node));
      diff.updated
        .filter(update => update.insertBefore).forEach(update => el.insertBefore(update.node, update.insertBefore));
      return el;
    }),
    distinctUntilChanged(),
  );

  return { node };
}
