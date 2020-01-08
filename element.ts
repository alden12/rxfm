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

// export type Children<T extends Node> =
//   // string
//   // | Observable<string>
//   | Observable<Node>
//   | Observable<Node>[]
//   | Observable<Observable<Node>[]>
//   | ((el: T) => Observable<Node>[])
//   | ((el: T) => Observable<Observable<Node>[]>);

// export type NodeTypes = Node | string | (Node | string)[];
export type ChildElement = Node | string | (Node | string)[] | Observable<Node | Node[]>;

export function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K
): Observable<HTMLElementTagNameMap[K]> {
  return of(document.createElement(tagName));
}

export function coerceChildElement<T extends HTMLElement>(
  child: ChildElement | ((el: T) => ChildElement),
  el: T,
): Observable<Node[]> {
  const childElement = typeof child === 'function' ? child(el) : child;
  // let nodeArray$: Observable<Node[]>;
  if (childElement instanceof Observable) {
    return childElement.pipe(
      map(nodeOrNodeArray => Array.isArray(nodeOrNodeArray) ? nodeOrNodeArray : [nodeOrNodeArray]),
    )
  } else {
    const nodeOrStringArray = Array.isArray(childElement) ? childElement : [childElement];
    const nodeArray = nodeOrStringArray.map(
      nodeOrString => typeof nodeOrString === 'string' ? document.createTextNode(nodeOrString) : nodeOrString);
    return of(nodeArray);
  }
  // const nodes$ = childElement instanceof Observable ? childElement : of(childElement);
  // return nodes$.pipe(
  //   map(nodes => Array.isArray(nodes) ? nodes : [nodes]),
  //   // Passing in a string observable should not have to recreate text node each change.
  //   map((nodes) => nodes.map(node => typeof node === 'string' ? document.createTextNode(node) : node)),
  // );
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
  ...children: (ChildElement | ((el: T) => ChildElement))[]
): (node: Observable<T>) => Observable<T> {
  return (node: Observable<T>): Observable<T> => node.pipe(
    switchMap(el => {
        const nodeArrays$ = children.map(child => coerceChildElement(child, el));
        const unflattenedNodes$: Observable<Node[][]> = combineLatest(...nodeArrays$).pipe(
          debounceTime(0),
        );
        const nodes$ = unflattenedNodes$.pipe(
          map(unflattened => unflattened.reduce<Node[]>((flat, nodeArr) => flat.concat(nodeArr), [])),
        );
        return nodes$.pipe(
          map(nodes => updateElementChildren(el, nodes)),
        );
    }),
    distinctUntilChanged(),
  );
}

export function updateElementAttributes<T extends HTMLElement>(
  el: T,
  oldAttributes: Attributes,
  newAttributes: Attributes,
): T {
  const diff = attributeDiffer(oldAttributes, newAttributes);
  Object.keys(diff.updated).forEach(key => {
    el.setAttribute(key, diff.updated[key]);
  });
  diff.removed.forEach(attr => el.removeAttribute(attr));
  return el;
}

export function attributes<T extends HTMLElement>(
  attributes: Attributes | Observable<Attributes>, // Allow observable attribute keys?
): (node: Observable<T>) => Observable<T> {
  return (node: Observable<T>): Observable<T> => node.pipe(
    switchMap(el => {
      const attributesObservable = attributes instanceof Observable ? attributes : of(attributes);
      let previousAttributes: Attributes = {};
      return attributesObservable.pipe(
        map(attributes_ => {
          updateElementAttributes(el, previousAttributes, attributes_); // Get attributes from element rather than saving old?
          previousAttributes = attributes_;
          return el;
        })
      );
    }),
    distinctUntilChanged(),
  );
}

// TODO: Attributes.
// export function element<K extends keyof HTMLElementTagNameMap>(
//   tagName: K,
//   children: Children<HTMLElementTagNameMap[K]>
// ): Observable<HTMLElementTagNameMap[K]>;
// export function element<K extends keyof HTMLElementTagNameMap>(
//   tagName: K,
//   attributes: Attributes | Observable<Attributes>,
//   children: Children<HTMLElementTagNameMap[K]>
// ): Observable<HTMLElementTagNameMap[K]>;
// export function element<K extends keyof HTMLElementTagNameMap>(
//   tagName: K,
//   attributesOrChildren:
//     | Attributes
//     | Observable<Attributes>
//     | Children<HTMLElementTagNameMap[K]>,
//   childrenOrUndefined?: Children<HTMLElementTagNameMap[K]>
// ): Observable<HTMLElementTagNameMap[K]> {
//   let attributes: Attributes | Observable<Attributes>;
//   let children: Children<HTMLElementTagNameMap[K]>;
//   if (childrenOrUndefined) {
//     attributes = attributesOrChildren as Attributes | Observable<Attributes>;
//     children = childrenOrUndefined;
//   } else {
//     attributes = {};
//     children = attributesOrChildren as Children<HTMLElementTagNameMap[K]>;
//   }

//   const el = document.createElement(tagName);
//   const childrenObservable =
//     typeof children === "function" ? children(el) : children;
//   const childrenArrayObservable = Array.isArray(childrenObservable)
//     ? of(childrenObservable)
//     : childrenObservable;
//   const childrenArray = (childrenArrayObservable as Observable<
//     Node | Observable<Node>[]
//   >).pipe(
//     map(nodeOrEls => (Array.isArray(nodeOrEls) ? nodeOrEls : [of(nodeOrEls)])),
//     map(elementes => elementes.filter(el => el)),
//     switchMap(elementes => combineLatest<Node[]>(...elementes)),
//     map(nodes => nodes.filter(node => node)),
//     debounceTime(0)
//   );

//   const processChildren = childrenArray.pipe(
//     map(children_ => {
//       const diff = childDiffer(Array.from(el.childNodes.values()), children_);
//       diff.removed.forEach(node => el.removeChild(node));
//       el.append(
//         ...diff.updated
//           .filter(update => !update.insertBefore)
//           .map(update => update.node)
//       );
//       diff.updated
//         .filter(update => update.insertBefore)
//         .forEach(update => el.insertBefore(update.node, update.insertBefore));

//       return el;
//     })
//   );

//   const attributesObservable =
//     attributes instanceof Observable ? attributes : of(attributes);

//   let previousAttributes: Attributes = {};
//   const processAttributes = attributesObservable.pipe(
//     map(attributes_ => {
//       const diff = attributeDiffer(previousAttributes, attributes_);
//       previousAttributes = attributes_;
//       Object.keys(diff.updated).forEach(key => {
//         el.setAttribute(key, diff.updated[key]);
//       });
//       diff.removed.forEach(attr => el.removeAttribute(attr));

//       return el;
//     })
//   );

//   return merge(processChildren, processAttributes).pipe(distinctUntilChanged());
// }

// export function div(children: Children<HTMLDivElement>) {
//   return element("div", children);
// }

export const app = () => {
  // const content = (el: Node) =>
  //   fromEvent(el, "click").pipe(
  //     startWith(undefined),
  //     scan(elements => [...elements, div([text("counter(1)")])], []),
  //     tap(val => console.log(val))
  //   );

  // return div(element("div", { style: "color: red" }, text("hello")));
  return element('div').pipe(
    attributes({ style: 'color: red' }),
    children(
      'hello world',
      // node('div').pipe(children(
      //   interval(10000).pipe(
      //     map(i => i.toString()),
      //   )
      // )),
    ),
  );
};
