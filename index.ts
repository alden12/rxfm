import { of, interval, Observable, combineLatest } from 'rxjs'; 
import { scan, map, distinctUntilChanged, debounceTime } from 'rxjs/operators';

export function text(text: Observable<string>): Observable<Text> {
  return text.pipe(
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

  // Easy Method:
  const orderUnchanged = remainingNewOrder.every((node, i) => remainingOldOrder[i] === node);
  const _unchangedNodes = orderUnchanged ? new Set() : new Set(remainingNewOrder);

  // Fancy method:
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

  const unchangedNodes = new Set(
    newChildren.filter(node => oldSet.has(node) && !reordered.has(node)),
  );
  // End.

  let insertBefore: Node;
  let updated: INodeUpdate[] = [];
  for (let i = newChildren.length - 1; i >= 0; i--) {
    const node = newChildren[i];
    if (unchangedNodes.has(node)) {
      insertBefore = node;
    } else {
      updated.push({ node, insertBefore });
    }
  }

  const removed = oldChildren.filter(child => !newSet.has(child));

  return { updated, removed };
}

export type Children = Observable<Node> | Observable<Node>[];

// TODO: Allow Observable<Observable<Node>[]>.
// TODO: Attributes.
// TODO: Children differ.
export function element<K extends keyof HTMLElementTagNameMap>(tagName: K, children: Children): Observable<HTMLElementTagNameMap[K]> {
  const childrenArray = Array.isArray(children) ? children : [children];
  const children$ = combineLatest(...childrenArray).pipe(
    debounceTime(0),
  );

  return children$.pipe(
    scan((el, children) => {
      children.forEach(child => {
        el.appendChild(child);
      });
      return el;
    }, document.createElement(tagName)),
    distinctUntilChanged(),
  );
}

export function div(children: Children) {
  return element('div', children);
}

const counter = (multi: number) => interval(1000).pipe(map(i => `count: ${multi * i}`));

div([
  div(text(counter(1))),
  div(text(counter(2))),
  div(text(counter(3))),
]).subscribe(el => document.body.appendChild(el));
