import { Component } from './component';
import { switchMap, tap, map, startWith, distinctUntilChanged } from 'rxjs/operators';

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
      startWith(node),
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
