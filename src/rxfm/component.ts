import { Observable, of } from 'rxjs';
import { map, distinctUntilKeyChanged } from 'rxjs/operators';

export interface IComponent<T extends Node, E = {}> {
    node: T;
    events?: Observable<E>;
}

export type Component<T extends Node, E = {}> = Observable<IComponent<T, E>>;

export type ComponentOperator<T extends Node, E, O = E> =
    (component: Component<T, E>) => Component<T, O>;

export type ComponentEventOperator<T extends Node, E, K extends string, O> = (component: Component<T, E>) =>
    Component<T, {
        [KE in keyof (E & Record<K, O>)]?:
            KE extends keyof E
                ? KE extends K ? E[KE] | O : E[KE]
                : KE extends K ? O : never
    }>;

export const SHARE_REPLAY_CONFIG = { bufferSize: 1, refCount: true };

export function text<E = {}>(text: string | number | Observable<string | number>): Observable<IComponent<Text, E>> {
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

export function component<K extends keyof HTMLElementTagNameMap, E = {}>(
    tagName: K,
): Component<HTMLElementTagNameMap[K], E> {
    return of({ node: document.createElement(tagName) });
}

export function div<E = {}>() {
    return component<'div', E>('div');
}