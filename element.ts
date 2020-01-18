import { of, interval, Observable, combineLatest, fromEvent, BehaviorSubject } from "rxjs";
import {
  map,
  distinctUntilChanged,
  debounceTime,
  switchMap,
  shareReplay,
  filter,
  tap,
  startWith,
  mapTo,
} from "rxjs/operators";

import "./element.css";

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

// TODO: Allow number input.
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

export type ChildElement =
  | Node
  | string
  | (Node | string)[]
  | Observable<Node | string | Node[]>;

export function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K
): Observable<HTMLElementTagNameMap[K]> {
  return of(document.createElement(tagName));
}

export function div() {
  return element("div");
}

export function coerceChildElement<T extends HTMLElement>(
  child: ChildElement | ((el: T) => ChildElement),
  el: T
): Observable<Node[]> {
  const childElement = typeof child === "function" ? child(el) : child;
  if (childElement instanceof Observable) {
    let textNode: Text;
    return childElement.pipe(
      map(nodeOrStringOrNodeArray => {
        if (typeof nodeOrStringOrNodeArray === "string") {
          textNode = textNode || document.createTextNode("");
          textNode.nodeValue = nodeOrStringOrNodeArray;
          return [textNode];
        }
        return Array.isArray(nodeOrStringOrNodeArray)
          ? nodeOrStringOrNodeArray
          : [nodeOrStringOrNodeArray];
      }),
      distinctUntilChanged()
    );
  } else {
    const nodeOrStringArray = Array.isArray(childElement)
      ? childElement
      : [childElement];
    const nodeArray = nodeOrStringArray.map(nodeOrString =>
      typeof nodeOrString === "string"
        ? document.createTextNode(nodeOrString)
        : nodeOrString
    );
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
  return (node: Observable<T>): Observable<T> =>
    node.pipe(
      switchMap(el => {
        const nodeArrays$ = children.map(child =>
          coerceChildElement(child, el)
        );
        const unflattenedNodes$: Observable<Node[][]> = combineLatest(
          ...nodeArrays$
        ).pipe(debounceTime(0));
        const nodes$ = unflattenedNodes$.pipe(
          map(unflattened =>
            unflattened.reduce<Node[]>(
              (flat, nodeArr) => flat.concat(nodeArr),
              []
            )
          )
        );
        let previousNodes: Node[] = [];
        return nodes$.pipe(
          map(nodes => {
            updateElementChildren(el, previousNodes, nodes);
            previousNodes = nodes;
            return el;
          })
        );
      }),
      distinctUntilChanged()
    );
}

export function updateElementAttributes<T extends HTMLElement>(
  el: T,
  oldAttributes: Attributes,
  newAttributes: Attributes
): T {
  const diff = attributeDiffer(oldAttributes, newAttributes);
  Object.keys(diff.updated).forEach(key => {
    el.setAttribute(key, diff.updated[key]);
  });
  diff.removed.forEach(attr => el.removeAttribute(attr));
  return el;
}

export function attributes<T extends HTMLElement>(
  attributes: Attributes | Observable<Attributes>
): (node: Observable<T>) => Observable<T> {
  return (node: Observable<T>): Observable<T> =>
    node.pipe(
      switchMap(el => {
        const attributesObservable =
          attributes instanceof Observable ? attributes : of(attributes);
        let previousAttributes: Attributes = {};
        return attributesObservable.pipe(
          map(attributes_ => {
            updateElementAttributes(el, previousAttributes, attributes_);
            previousAttributes = attributes_;
            return el;
          })
        );
      }),
      distinctUntilChanged()
    );
}

export function attribute<T extends HTMLElement, A>(
  attribute: string,
  value: A | Observable<A>,
  valueFunction: (val: A) => string
): (node: Observable<T>) => Observable<T> {
  const value$ = value instanceof Observable ? value : of(value);
  const attributes$ = value$.pipe(
    map(val => ({ [attribute]: valueFunction(val) })),
  );
  return attributes(attributes$);
}

export type Style = { [name: string]: string | number };

export function style<T extends HTMLElement>(
  style: Style | Observable<Style>
): (node: Observable<T>) => Observable<T> {
  return attribute("style", style, (val: Style) =>
    Object.keys(val).reduce(
      (string, key) => `${string}${key}: ${val[key]}; `,
      ""
    )
  );
}

export function classes<T extends HTMLElement>(
  classes: string | string[] | Observable<string | string[]>
): (node: Observable<T>) => Observable<T> {
  return attribute("class", classes, (val: string | string[]) =>
    (Array.isArray(val) ? val : [val]).join(" ")
  );
}

export function generate<T, N extends Node>(
  idFunction: (item: T) => string,
  creationFunction: (item: Observable<T>) => Observable<N>,
): (items: Observable<T[]>) => Observable<N[]> {
  return (items$: Observable<T[]>) => {
    let previousIds = new Set<string>();
    const updates = items$.pipe(
      map(items => {
        const itemIds = items.map(item => idFunction(item));
        const idSet = new Set(...itemIds);
        const updatedIds = Array.from(idSet.values()).filter(id =>
          previousIds.has(id)
        );
        previousIds = idSet;
        return new Map(updatedIds.map((id): [string, T] => [id, items[id]]));
      }),
      shareReplay(1)
    );

    let previousElements = new Map<string, Observable<N>>();
    return items$.pipe(
      map(items => {
        const elMap = new Map(
          items.map(item => {
            const id = idFunction(item);
            if (previousElements.has(id)) {
              return [id, previousElements.get(id)];
            }
            const itemUpdates = updates.pipe(
              filter(update => update.has(id)),
              map(update => update.get(id)),
              startWith(item)
            );
            return [id, creationFunction(itemUpdates).pipe(shareReplay(1))];
          })
        );

        previousElements = elMap;
        return elMap;
      }),
      switchMap(elMap => combineLatest<N[]>(...Array.from(elMap.values()))),
      debounceTime(0)
    );
  };
}

export function holdState<T, S>(
  stateFunction: (input: T, previousState: Partial<S>) => Partial<S>,
  initialState: Partial<S> = {},
): (input: Observable<T>) => Observable<Partial<S>> {
  let previousState = initialState;
  return (input: Observable<T>) =>
    input.pipe(
      map(value => ({
        ...previousState,
        ...stateFunction(value, previousState)
      })), // TODO: Use scan.
      distinctUntilChanged((prev, curr) => Object.keys(curr).every(key => curr[key] === prev[key])),
      tap(state => previousState = state),
      startWith(initialState),
      shareReplay(1),
    );
}

export class CheekyState<T> {
  private stateSubject: BehaviorSubject<Partial<T>>;

  constructor(initialState: Partial<T> = {}) {
    this.stateSubject = new BehaviorSubject<Partial<T>>(initialState);
  }

  public get state(): Observable<Partial<T>> {
    return this.stateSubject.asObservable();
  };
  public get currentState(): Partial<T> {
    return this.stateSubject.value;
  };

  public setState(stateRequest: Partial<T>) {
    if (Object.keys(stateRequest).some(key => stateRequest[key] !== this.currentState[key])) {
      this.stateSubject.next({
        ...this.currentState,
        ...stateRequest,
      });
    }
  }
}

export function cheekySideEffect<T, S>(
  trigger: (input: T) => Observable<S>,
  sideEffect: (value: S) => any,
): (input: Observable<T>) => Observable<T> {
  return (input: Observable<T>) => input.pipe(
    switchMap(ip => trigger(ip).pipe(
      tap(sideEffect),
      startWith(ip),
      mapTo(ip),
    )),
    distinctUntilChanged(),
  );
}

export const app = () => {
  const state = new CheekyState({ color: 'orange' });

  return div().pipe(
    style(
      state.state.pipe(
        map(({ color }) => ({
          color,
          "background-color": "lightGrey"
        })),
      )
    ),
    classes(["element", "large"]),
    children(
      "hello world",
      div().pipe(children(interval(1000).pipe(map(i => i.toString())))),
      of([1, 2, 3]).pipe(
        generate(
          item => `${item}`,
          item => div().pipe(
            children(item.pipe(map(i => `${i}`))),
            cheekySideEffect(
              el => fromEvent(el, 'click'),
              () => state.setState({ color: state.currentState.color === 'orange' ? 'blue' : 'orange' }),
            )
          ),
        )
      )
    )
  );
};
