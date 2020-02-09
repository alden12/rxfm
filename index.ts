// import { of, interval, Observable, combineLatest, fromEvent } from 'rxjs'; 
// import { scan, map, distinctUntilChanged, debounceTime, switchMap, shareReplay, tap, share, filter, startWith } from 'rxjs/operators';
// import { app as myApp } from './element';
import { of, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { div, children } from './component';

const app = div().pipe(
  children(
    'hello',
    div().pipe(
      map(({ node }) => ({ node, events: fromEvent(node, 'click') })),
      children('world!'),
    ),
  ),
);

app.subscribe(({ node, events }) => {
  document.body.appendChild(node);
  events.subscribe(console.log)
});

// // TODO: Allow string input.
// export function text(text: Observable<string> | string): Observable<Text> {
//   const textObservable = typeof text === 'string' ? of(text) : text;
//   return textObservable.pipe(
//     scan((textNode, content) => {
//       textNode.nodeValue = content;
//       return textNode;
//     }, document.createTextNode('')),
//     distinctUntilChanged(),
//   );
// }

// export interface INodeUpdate {
//   node: Node;
//   insertBefore?: Node;
// }

// export interface IChildDiff {
//   updated: INodeUpdate[];
//   removed: Node[];
// }

// export function childDiffer(oldChildren: Node[], newChildren: Node[]): IChildDiff {
//   const oldSet = new Set(oldChildren);
//   const newSet = new Set(newChildren);

//   const remainingOldOrder = oldChildren.filter(node => newSet.has(node));
//   const remainingNewOrder = newChildren.filter(node => oldSet.has(node));

//   const orderUnchanged = remainingNewOrder.every((node, i) => remainingOldOrder[i] === node);

//   let unchangedNodes: Set<Node>;
//   if (orderUnchanged) {
//     unchangedNodes = new Set(remainingNewOrder);
//   } else {
//     const oldNodeAndNext = new Map(
//       remainingOldOrder.map((node, i) => [node, remainingOldOrder[i + 1]]),
//     );
//     const newElementesAndIndex = new Map(
//       remainingNewOrder.map((node, i) => [node, i]),
//     );

//     const reordered = new Set(
//       remainingNewOrder.filter((node, i) => {
//         const oldNext = oldNodeAndNext.get(node);
//         const newIndexOfNext = newElementesAndIndex.get(oldNext) || Infinity;
//         return newIndexOfNext < i;
//       })
//     );

//     unchangedNodes = new Set(
//       newChildren.filter(node => oldSet.has(node) && !reordered.has(node)),
//     );
//   }

//   let insertBefore: Node;
//   const updated: INodeUpdate[] = [];
//   for (let i = newChildren.length - 1; i >= 0; i--) {
//     const node = newChildren[i];
//     if (unchangedNodes.has(node)) {
//       insertBefore = node;
//     } else {
//       updated.push({ node, insertBefore });
//     }
//   }
//   updated.reverse();

//   const removed = oldChildren.filter(child => !newSet.has(child));

//   return { updated, removed };
// }

// export type Children<T extends Node = Node> =
//   // string
//   // | Observable<string>
//   // | Observable<T>
//   | Observable<T>[]
//   | Observable<Observable<T>[]>
//   | ((T) => Observable<T>[])
//   | ((T) => Observable<Observable<T>[]>)
//   ;

// export interface IAction<T, P> {
//   type: T;
//   payload: P;
// }

// export type Actions<T> = { [K in keyof T]: IAction<K, T[K]> };

// export type Action<T> = Observable<Actions<T>[keyof T]>;

// export type Outputs<T> = { [K in keyof T]: Observable<T[K]> };

// export interface IElement<T extends Node, O = {}, A = {}> {
//   node: Observable<T>;
//   outputs?: Outputs<O>;
//   actions?: Action<A>;
// }

// // TODO: Attributes.
// export function element<K extends keyof HTMLElementTagNameMap>(tagName: K, children: Children): Observable<HTMLElementTagNameMap[K]> {

//   const el = document.createElement(tagName);
//   const childrenObservable = typeof children === 'function' ? children(el) : children;
//   const childrenArrayObservable = Array.isArray(childrenObservable) ? of(childrenObservable) : childrenObservable;
//   const childrenArray = childrenArrayObservable.pipe(
//     map(array => array.filter(el => el)),
//     switchMap(array => combineLatest<Node[]>(...array)),
//     map(nodes => nodes.filter(node => node)),
//     debounceTime(0),
//   );

//   return childrenArray.pipe(
//     map(children => {
//       const diff = childDiffer(Array.from(el.childNodes.values()), children);
//       diff.removed.forEach(node => el.removeChild(node));
//       el.append(...diff.updated.filter(update => !update.insertBefore).map(update => update.node));
//       diff.updated
//         .filter(update => update.insertBefore).forEach(update => el.insertBefore(update.node, update.insertBefore));
//       return el;
//     }),
//     distinctUntilChanged(),
//   );
// }

// export function div(children: Children) {
//   return element('div', children);
// }

// export function event(element: Observable<Node>, eventName: string): Observable<Event> {
//   return element.pipe(
//     filter(el => !!el),
//     switchMap(el => fromEvent(el, eventName)),
//   );
// }

// const counter = (multi: number) => interval(1000).pipe(
//   map(i => `count: ${multi * i}`),
//   share(),
// );

// const conditional = (element: Observable<Node>, condition: Observable<boolean>) => condition.pipe(
//   distinctUntilChanged(),
//   switchMap(show => show ? element : of(undefined)),
//   distinctUntilChanged(),
// );

// const conditionalCounter = (counter: Observable<number>): Observable<Node> => {
//   const input = counter.pipe(shareReplay(1));
//   const element = div([text(input.pipe(map(i => i.toString())))]);
//   return conditional(
//     element,
//     input.pipe(
//       map(i => i % 4 !== 0),
//     ),
//   );
// };

// const condCounter = conditionalCounter(interval(1000)).pipe(share());

// event(condCounter, 'click').subscribe(ev => console.log(ev));

// const app = () => {
//   const content = (el: Node) => fromEvent(el, 'click').pipe(
//     startWith(undefined),
//     scan(elements => [...elements, div([text('counter(1)')])], []),
//     tap(val => console.log(val)),
//   );

//   return div(content);
// };

// app().subscribe(el => document.body.appendChild(el));

// myApp().subscribe(el => document.body.appendChild(el));
