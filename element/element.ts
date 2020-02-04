import {
  Observable,
  of,
} from 'rxjs';

export interface IComponent {
  node: Node;
}

export function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K
): Observable<HTMLElementTagNameMap[K]> {
  return of(document.createElement(tagName));
}

export function div() {
  return element("div");
}
