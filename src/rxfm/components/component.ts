import { Observable, of, EMPTY } from 'rxjs';
import { map, distinctUntilKeyChanged, distinctUntilChanged } from 'rxjs/operators';

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

export function addToView(
  component: Component<Node, any> | (() => Component<Node, any>),
  host: HTMLElement,
): Remove {
  let oldNode: Node;
  const subscription = (typeof component === 'function' ? component() : component).pipe(
    map(({ node }) => node),
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

export function addToBody(component: Component<Node, any> | (() => Component<Node, any>)): Remove {
  return addToView(component, document.body);
}
