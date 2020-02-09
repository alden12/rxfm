import { Observable, of } from 'rxjs';
import { map, distinctUntilKeyChanged } from 'rxjs/operators';

// export interface IComponent<T extends Node, E = undefined> {
//   node: T;
//   event?: E;
// }

export interface IComponent<T extends Node, E = undefined> {
  node: T;
  events?: Observable<E>;
}

export type Component<T extends Node, E = undefined> = Observable<IComponent<T, E>>;

export function text<E = undefined>(text: string | number | Observable<string | number>): Observable<IComponent<Text, E>> {
  const textObservable = text instanceof Observable ? text : of(text);
  const node = document.createTextNode("");
  return textObservable.pipe(
    map(content => typeof content === 'string' ? content : content.toString()),
    map(content => {
      node.nodeValue = content;
      return { node };
    }),
    distinctUntilKeyChanged('node'),
  );
}

export function component<K extends keyof HTMLElementTagNameMap, E = undefined>(
  tagName: K
): Component<HTMLElementTagNameMap[K], E> {
  return of({ node: document.createElement(tagName) });
}

export function div<E = undefined>() {
  return component<'div', E>('div');
}
