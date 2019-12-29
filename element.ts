import { of, interval, Observable, combineLatest, fromEvent } from 'rxjs'; 
import { scan, map, distinctUntilChanged, debounceTime, switchMap, shareReplay, tap, share, filter, startWith } from 'rxjs/operators';

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

// TODO: Allow string input.
export function text(text: Observable<string> | string): Observable<Text> {
  const textObservable = typeof text === 'string' ? of(text) : text;
  const textNode = document.createTextNode('');
  return textObservable.pipe(
    map(content => {
      textNode.nodeValue = content;
      return textNode;
    }),
    distinctUntilChanged(),
  );
}

export type Children<T extends Node> =
  // string
  // | Observable<string>
  // | Observable<T>
  | Observable<Node>[]
  | Observable<Observable<Node>[]>
  | ((el: T) => Observable<Node>[])
  | ((el: T) => Observable<Observable<Node>[]>)
  ;

// TODO: Attributes.
export function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  children: Children<Node>,
): Observable<HTMLElementTagNameMap[K]> {

  const el = document.createElement(tagName);
  const childrenObservable = typeof children === 'function' ? children(el) : children;
  const childrenArrayObservable = Array.isArray(childrenObservable) ? of(childrenObservable) : childrenObservable;
  const childrenArray = childrenArrayObservable.pipe(
    map(nodes => nodes.filter(el => el)),
    switchMap(nodes => combineLatest<Node[]>(...nodes)),
    map(nodes => nodes.filter(node => node)),
    debounceTime(0),
  );

  return childrenArray.pipe(
    map(children => {
      // const childNodes = children.map(child => child.node);
      const diff = childDiffer(Array.from(el.childNodes.values()), children);
      diff.removed.forEach(node => el.removeChild(node));
      el.append(...diff.updated.filter(update => !update.insertBefore).map(update => update.node));
      diff.updated
        .filter(update => update.insertBefore).forEach(update => el.insertBefore(update.node, update.insertBefore));

      return el;
    }),
    distinctUntilChanged(),
  );
}

export function div(children: Children<Node>) {
  return element('div', children);
}

export const app = () => {
  const content = (el: Node) => fromEvent(el, 'click').pipe(
    startWith(undefined),
    scan(elements => [...elements, div([text('counter(1)')])], []),
    tap(val => console.log(val)),
  );

  return div(content);
};
