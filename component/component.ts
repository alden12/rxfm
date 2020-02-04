import { Observable, of } from 'rxjs';

export interface IComponent<T extends Node, E = undefined> {
  node: Node;
  event?: E;
}

export function component<K extends keyof HTMLElementTagNameMap, E = undefined>(
  tagName: K
): Observable<IComponent<HTMLElementTagNameMap[K], E>> {
  return of({ node: document.createElement(tagName) });
}

export function div<E = undefined>() {
  return component<'div', E>('div');
}
