import { Observable, of, EMPTY } from 'rxjs';
import { map, distinctUntilKeyChanged, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

export interface IComponent<T extends Node, E = {}> {
  node: T;
  events: Observable<E>;
}

export type Component<T extends Node, E = {}> = Observable<IComponent<T, E>>;

export type ComponentOperator<T extends Node, E, O = E> = (component: Component<T, E>) => Component<T, O>;

export function text<E = {}>(
  textOrTextObservable: string | number | Observable<string | number>
): Observable<IComponent<Text, E>> {
  const textObservable = textOrTextObservable instanceof Observable ? textOrTextObservable : of(textOrTextObservable);
  const node = document.createTextNode("");
  return textObservable.pipe(
    map(content => typeof content === 'string' ? content : content.toString()),
    map(content => {
      node.nodeValue = content;
      return { node, events: EMPTY };
    }),
    distinctUntilKeyChanged('node'),
  );
}

export function component<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
): Component<HTMLElementTagNameMap[K], {}> {
  return of({ node: document.createElement(tagName), events: EMPTY });
}

export type Remove = () => void;

export function addToView<E = {}>(
  component: Component<Node, E> | (() => Component<Node, E>),
  host: HTMLElement,
  eventHandler?: (event: E) => void,
): Remove {
  let oldNode: Node;
  const subscription = (typeof component === 'function' ? component() : component).pipe(
    switchMap(({ node, events }) => events.pipe(
      tap(event => typeof eventHandler === 'function' && eventHandler(event)),
      map(() => node),
    )),
    distinctUntilChanged(),
  ).subscribe(node => {
    if (oldNode) {
      host.replaceChild(node, oldNode);
    } else {
      host.appendChild(node);
    }
    oldNode = node;
  });

  return () => {
    subscription.unsubscribe();
    host.removeChild(oldNode);
  }
}

export function addToBody<E = {}>(
  component: Component<Node, E> | (() => Component<Node, E>),
  eventHandler?: (event: E) => void,
): Remove {
  return addToView(component, document.body, eventHandler);
}
