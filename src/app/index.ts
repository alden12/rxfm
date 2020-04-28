import { addToBody, ChildComponent, ComponentOperator, HTMLElementEvent } from 'rxfm';
import { app } from './todo';
import { of, Observable, EMPTY, OperatorFunction } from 'rxjs';

addToBody(app);

export interface IComponent<T extends Node, E = never> {
  node: T;
  events: Observable<E>;
}

export type Component<T extends Node, E = never> = Observable<IComponent<T, E>>;

type ChildEvents<T extends ChildComponent<Node, any>[]> = T extends ChildComponent<Node, infer E>[] ? E : never;

function children<T extends HTMLElement, E, C extends ChildComponent<Node, any>[]>(
  ...childComponents: C
): ComponentOperator<T, E, E | ChildEvents<C>> {
  return undefined;
}

function component<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
): Component<HTMLElementTagNameMap[K]> {
  return of({ node: document.createElement(tagName), events: EMPTY });
}

const div = () => component('div');

export type InjectEvent<T extends Node, E, O> = ComponentOperator<T, E, E | O>
// export type InjectEvent<T extends Node, E, K extends string, V> = ComponentOperator<T, E, {
//   [KE in keyof (E & Record<K, V>)]?:
//     KE extends keyof E
//       ? KE extends K ? E[KE] | V : E[KE]
//       : KE extends K ? V : never
// }>;

// tslint:disable: max-line-length
export function event<T extends Node, E, EV>(event: Observable<EV> | ((node: T) => Observable<EV>)): InjectEvent<T, E, EV>
export function event<T extends Node, E, ET extends string>(eventType: ET): InjectEvent<T, E, HTMLElementEvent<T, ET>>
export function event<T extends Node, E, ET extends string, EV>(eventType: ET, op: OperatorFunction<HTMLElementEvent<T, ET>, EV>): InjectEvent<T, E, EV>
// export function event<T extends Node, E, ET extends string, K extends string, OP1, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op: OperatorFunction<OP1, Record<K, R>>): InjectEvent<T, E, K, R>
// export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op: OperatorFunction<OP2, Record<K, R>>): InjectEvent<T, E, K, R>
// export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op: OperatorFunction<OP3, Record<K, R>>): InjectEvent<T, E, K, R>
// export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op: OperatorFunction<OP4, Record<K, R>>): InjectEvent<T, E, K, R>
// export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op: OperatorFunction<OP5, Record<K, R>>): InjectEvent<T, E, K, R>
// export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, OP6, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op6: OperatorFunction<OP5, OP6>, op: OperatorFunction<OP6, Record<K, R>>): InjectEvent<T, E, K, R>
// export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, OP6, OP7, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op6: OperatorFunction<OP5, OP6>, op7: OperatorFunction<OP6, OP7>, op: OperatorFunction<OP7, Record<K, R>>): InjectEvent<T, E, K, R>
// export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, OP6, OP7, OP8, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op6: OperatorFunction<OP5, OP6>, op7: OperatorFunction<OP6, OP7>, op8: OperatorFunction<OP7, OP8>, op: OperatorFunction<OP8, Record<K, R>>): InjectEvent<T, E, K, R>
// tslint:enable: max-line-length

export function event<T extends Node, E, ET extends string, EV>(
  eventType: ET | Observable<EV> | ((node: T) => Observable<EV>),
  ...operators: OperatorFunction<any, any>[]
): InjectEvent<T, E, EV> {
  return undefined;
}
