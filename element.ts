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

export type ChildElement = Node | string | (Node | string)[] | Observable<Node | string | Node[]>;

export function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K
): Observable<HTMLElementTagNameMap[K]> {
  return of(document.createElement(tagName));
}

export function div() {
  return element('div');
}

export function coerceChildElement<T extends HTMLElement>(
  child: ChildElement | ((el: T) => ChildElement),
  el: T,
): Observable<Node[]> {
  const childElement = typeof child === 'function' ? child(el) : child;
  if (childElement instanceof Observable) {
    let textNode: Text;
    return childElement.pipe(
      map(nodeOrStringOrNodeArray => {
        if (typeof nodeOrStringOrNodeArray === 'string') {
          textNode = textNode || document.createTextNode('');
          textNode.nodeValue = nodeOrStringOrNodeArray;
          return [textNode];
        }
        return Array.isArray(nodeOrStringOrNodeArray) ? nodeOrStringOrNodeArray : [nodeOrStringOrNodeArray]
      }),
      distinctUntilChanged(),
    )
  } else {
    const nodeOrStringArray = Array.isArray(childElement) ? childElement : [childElement];
    const nodeArray = nodeOrStringArray.map(
      nodeOrString => typeof nodeOrString === 'string' ? document.createTextNode(nodeOrString) : nodeOrString);
    return of(nodeArray);
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
        let previousNodes: Node[] = [];
        return nodes$.pipe(
          map(nodes => {
            updateElementChildren(el, previousNodes, nodes);
            previousNodes = nodes;
            return el;
          }),
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
  attributes: Attributes | Observable<Attributes>,
): (node: Observable<T>) => Observable<T> {
  return (node: Observable<T>): Observable<T> => node.pipe(
    switchMap(el => {
      const attributesObservable = attributes instanceof Observable ? attributes : of(attributes);
      let previousAttributes: Attributes = {};
      return attributesObservable.pipe(
        map(attributes_ => {
          updateElementAttributes(el, previousAttributes, attributes_);
          previousAttributes = attributes_;
          return el;
        })
      );
    }),
    distinctUntilChanged(),
  );
}

export const app = () => {
  return element('div').pipe(
    attributes({ style: 'color: red' }),
    children(
      'hello world',
      div().pipe(
        children(
          interval(1000).pipe(
            map(i => i.toString()),
          )
        )
      ),
    ),
  );
};
