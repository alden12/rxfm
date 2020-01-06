import {
  of,
  interval,
  Observable,
  combineLatest,
  fromEvent,
  merge
} from "rxjs";
import {
  scan,
  map,
  distinctUntilChanged,
  debounceTime,
  switchMap,
  shareReplay,
  tap,
  share,
  filter,
  startWith
} from "rxjs/operators";

export interface INodeUpdate {
  node: Node;
  insertBefore?: Node;
}

export interface IChildDiff {
  updated: INodeUpdate[];
  removed: Node[];
}

export function childDiffer(
  oldChildren: Node[],
  newChildren: Node[]
): IChildDiff {
  const oldSet = new Set(oldChildren);
  const newSet = new Set(newChildren);

  const remainingOldOrder = oldChildren.filter(node => newSet.has(node));
  const remainingNewOrder = newChildren.filter(node => oldSet.has(node));

  const orderUnchanged = remainingNewOrder.every(
    (node, i) => remainingOldOrder[i] === node
  );

  let unchangedNodes: Set<Node>;
  if (orderUnchanged) {
    unchangedNodes = new Set(remainingNewOrder);
  } else {
    const oldNodeAndNext = new Map(
      remainingOldOrder.map((node, i) => [node, remainingOldOrder[i + 1]])
    );
    const newElementesAndIndex = new Map(
      remainingNewOrder.map((node, i) => [node, i])
    );

    const reordered = new Set(
      remainingNewOrder.filter((node, i) => {
        const oldNext = oldNodeAndNext.get(node);
        const newIndexOfNext = newElementesAndIndex.get(oldNext) || Infinity;
        return newIndexOfNext < i;
      })
    );

    unchangedNodes = new Set(
      newChildren.filter(node => oldSet.has(node) && !reordered.has(node))
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

export type Attributes = { [attr: string]: string };

export interface IAttributeDiff {
  updated: Attributes;
  removed: string[];
}

export function attributeDiffer(
  oldAttributes: Attributes,
  newAttributes: Attributes
): IAttributeDiff {
  const updated = Object.keys(newAttributes).reduce(
    (updates, key) => {
      if (oldAttributes[key] !== newAttributes[key]) {
        updates[key] = newAttributes[key];
      }
      return updates;
    },
    {} as Attributes
  );

  const removed = Object.keys(oldAttributes).filter(key => !newAttributes[key]);

  return { updated, removed };
}

export function text(text: Observable<string> | string): Observable<Text> {
  const textObservable = typeof text === "string" ? of(text) : text;
  const textNode = document.createTextNode("");
  return textObservable.pipe(
    map(content => {
      textNode.nodeValue = content;
      return textNode;
    }),
    distinctUntilChanged()
  );
}

export type Children<T extends Node> =
  // string
  // | Observable<string>
  | Observable<Node>
  | Observable<Node>[]
  | Observable<Observable<Node>[]>
  | ((el: T) => Observable<Node>[])
  | ((el: T) => Observable<Observable<Node>[]>);

export type NodeTypes = Node | string | (Node | string)[];

export type ChildElement<T extends Node> =
  | NodeTypes
  | Observable<NodeTypes>
  | ((el: T) => Observable<NodeTypes>);

// Do attributes as a proceeding pipe?
// Do both as pipes?
export function node<K extends keyof HTMLElementTagNameMap>(
  tagName: K
): Observable<HTMLElementTagNameMap[K]> {
  return of(document.createElement(tagName));
}

export function coerceChildElements<T extends HTMLElement>(
  children: ChildElement<T>[],
  el: T,
){ // : Observable<Observable<Node>[]> {
  const coercedChildElements = children.map(child => coerceChildElement(child, el));
  
}

export function coerceChildElement<T extends HTMLElement>(
  child: ChildElement<T>,
  el: T,
): Observable<Node[]> {
  const nodesOrObservable = typeof child === 'function' ? child(el) : child;
  const nodes$ = nodesOrObservable instanceof Observable ? nodesOrObservable : of(nodesOrObservable);
  return nodes$.pipe(
    map(nodes => Array.isArray(nodes) ? nodes : [nodes]),
    map((nodes) => nodes.map(node => typeof node === 'string' ? document.createTextNode(node) : node)),
  );
}

export function updateElementChildren<T extends HTMLElement>(
  el: T,
  children: Node[]
): T {
  const diff = childDiffer(Array.from(el.childNodes.values()), children);

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

export function children<T extends HTMLElement>(
  ...children: ChildElement<T>[]
): (node: Observable<T>) => Observable<T> {
  return (node: Observable<T>): Observable<T> => {
    const res = node.pipe(
      map(el => children.map(child => coerceChildElement(child, el))),
      switchMap((nodeArrays$): Observable<Node[][]> => combineLatest(...nodeArrays$)),
      map(unflattened => unflattened.reduce<Node[]>((flat, nodeArr) => [...flat, ...nodeArr], [])),
      map(nodes => updateElementChildren(el, nodes)),
    );
  };
    // node.pipe(
    //   switchMap(el => getElementArrayObservable(children, el).pipe(
    //     switchMap((nodes$): Observable<Node[]> => combineLatest(...nodes$)),
    //   )),
    //   debounceTime(0),
    //   map(children_ => updateElementChildren(node, children_)),
      // switchMap(el => combineLatest(
      //     ...mapChildElementsToNodeArrayObservable(children, el),
      //   ).pipe(
      //     debounceTime(0),
      //     map(children_  => updateElementChildren(el, children_))
      //   ),
        // return childrenArray$.pipe(
        //   map(children_ => {
        //     const diff = childDiffer(
        //       Array.from(el.childNodes.values()),
        //       children_
        //     );
        //     diff.removed.forEach(node => el.removeChild(node));
        //     el.append(
        //       ...diff.updated
        //         .filter(update => !update.insertBefore)
        //         .map(update => update.node)
        //     );
        //     diff.updated
        //       .filter(update => update.insertBefore)
        //       .forEach(update =>
        //         el.insertBefore(update.node, update.insertBefore)
        //       );

        //     return el;
        //   })
        // );
    //   ),
    // );
}

// TODO: Attributes.
export function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  children: Children<HTMLElementTagNameMap[K]>
): Observable<HTMLElementTagNameMap[K]>;
export function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes: Attributes | Observable<Attributes>,
  children: Children<HTMLElementTagNameMap[K]>
): Observable<HTMLElementTagNameMap[K]>;
export function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributesOrChildren:
    | Attributes
    | Observable<Attributes>
    | Children<HTMLElementTagNameMap[K]>,
  childrenOrUndefined?: Children<HTMLElementTagNameMap[K]>
): Observable<HTMLElementTagNameMap[K]> {
  let attributes: Attributes | Observable<Attributes>;
  let children: Children<HTMLElementTagNameMap[K]>;
  if (childrenOrUndefined) {
    attributes = attributesOrChildren as Attributes | Observable<Attributes>;
    children = childrenOrUndefined;
  } else {
    attributes = {};
    children = attributesOrChildren as Children<HTMLElementTagNameMap[K]>;
  }

  const el = document.createElement(tagName);
  const childrenObservable =
    typeof children === "function" ? children(el) : children;
  const childrenArrayObservable = Array.isArray(childrenObservable)
    ? of(childrenObservable)
    : childrenObservable;
  const childrenArray = (childrenArrayObservable as Observable<
    Node | Observable<Node>[]
  >).pipe(
    map(nodeOrEls => (Array.isArray(nodeOrEls) ? nodeOrEls : [of(nodeOrEls)])),
    map(elementes => elementes.filter(el => el)),
    switchMap(elementes => combineLatest<Node[]>(...elementes)),
    map(nodes => nodes.filter(node => node)),
    debounceTime(0)
  );

  const processChildren = childrenArray.pipe(
    map(children_ => {
      const diff = childDiffer(Array.from(el.childNodes.values()), children_);
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
    })
  );

  const attributesObservable =
    attributes instanceof Observable ? attributes : of(attributes);

  let previousAttributes: Attributes = {};
  const processAttributes = attributesObservable.pipe(
    map(attributes_ => {
      const diff = attributeDiffer(previousAttributes, attributes_);
      previousAttributes = attributes_;
      Object.keys(diff.updated).forEach(key => {
        el.setAttribute(key, diff.updated[key]);
      });
      diff.removed.forEach(attr => el.removeAttribute(attr));

      return el;
    })
  );

  return merge(processChildren, processAttributes).pipe(distinctUntilChanged());
}

export function div(children: Children<HTMLDivElement>) {
  return element("div", children);
}

export const app = () => {
  const content = (el: Node) =>
    fromEvent(el, "click").pipe(
      startWith(undefined),
      scan(elements => [...elements, div([text("counter(1)")])], []),
      tap(val => console.log(val))
    );

  return div(element("div", { style: "color: red" }, text("hello")));
};
