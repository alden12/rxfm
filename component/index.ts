import { Observable, of } from 'rxjs';
import { map, distinctUntilKeyChanged } from 'rxjs/operators';

export * from './children';
export * from './events';

export interface IComponent<T extends Node, E = undefined> {
  node: T;
  events?: Observable<E>;
}

export type Component<T extends Node, E = undefined> = Observable<IComponent<T, E>>;

export type ComponentOperator<T extends Node, E = undefined, O = E> =
  (component: Component<T, E>) => Component<T, O>;

export const SHARE_REPLAY_CONFIG = { bufferSize: 1, refCount: true };

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
  tagName: K,
  ...operators: ComponentOperator<HTMLElementTagNameMap[K], E>[]
): Component<HTMLElementTagNameMap[K], E> {
  return operators.reduce(
    (component, operator) => component.pipe(operator),
    of({ node: document.createElement(tagName) }),
  );
}

export function div<E = undefined>(
  ...operators: ComponentOperator<HTMLDivElement, E>[]
) {
  return component<'div', E>('div', ...operators);
}
