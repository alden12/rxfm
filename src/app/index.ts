// import { addToBody, ChildComponent, ComponentOperatorOld, HTMLElementEvent } from 'rxfm';
// import { app } from './todo';
// import { of, Observable, EMPTY, OperatorFunction } from 'rxjs';
// import { map } from 'rxjs/operators';

import { div, children, addToBody, event, EmitEvent } from 'rxfm';
import { map, tap } from 'rxjs/operators';
import { interval } from 'rxjs';

const app = div().pipe(
  children('test'),
  event('click', map(ev => new EmitEvent('test', 1))),
);

// app.subscribe(el => {
//   document.body.appendChild(el);
//   document.body.addEventListener('test', console.log);
// });

addToBody(app.pipe(
  event('test', tap(console.log)),
));

// addToBody(app);

// export interface IComponent<T extends Node, E = never> {
//   node: T;
//   events: Observable<E>;
// }

// export type Component<T extends Node, E = never> = Observable<IComponent<T, E>>;

// type ArrayType<T extends any[]> = T extends (infer A)[] ? A : never;

// type ChildEvents<T extends ChildComponent<Node, any>[]> = ArrayType<{
//   [P in keyof T]: T[P] extends ChildComponent<Node, infer E> ? E : never;
// }>;

// // type ChildEvents<T extends ChildComponent<Node, any>[]> = T extends ChildComponent<Node, infer E>[] ? E : never;

// function children<T extends HTMLElement, E, C extends ChildComponent<Node, any>[]>(
//   ...childComponents: C
// ): ComponentOperatorOld<T, E, E | ChildEvents<C>> {
//   return undefined;
// }

// function component<K extends keyof HTMLElementTagNameMap>(
//   tagName: K,
// ): Component<HTMLElementTagNameMap[K]> {
//   return of({ node: document.createElement(tagName), events: EMPTY });
// }

// const div = () => component('div');

// tslint:disable: max-line-length
// export function event<T extends Node, E, EV>(event: Observable<EV> | ((node: T) => Observable<EV>)): ComponentOperatorOld<T, E, E | EV>
// export function event<T extends Node, E, ET extends string>(eventType: ET): ComponentOperatorOld<T, E, E | HTMLElementEvent<T, ET>>
// export function event<T extends Node, E, ET extends string, EV>(eventType: ET, op: OperatorFunction<HTMLElementEvent<T, ET>, EV>): ComponentOperatorOld<T, E, E | EV>
// // export function event<T extends Node, E, ET extends string, K extends string, OP1, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op: OperatorFunction<OP1, Record<K, R>>): InjectEvent<T, E, K, R>
// // export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op: OperatorFunction<OP2, Record<K, R>>): InjectEvent<T, E, K, R>
// // export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op: OperatorFunction<OP3, Record<K, R>>): InjectEvent<T, E, K, R>
// // export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op: OperatorFunction<OP4, Record<K, R>>): InjectEvent<T, E, K, R>
// // export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op: OperatorFunction<OP5, Record<K, R>>): InjectEvent<T, E, K, R>
// // export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, OP6, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op6: OperatorFunction<OP5, OP6>, op: OperatorFunction<OP6, Record<K, R>>): InjectEvent<T, E, K, R>
// // export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, OP6, OP7, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op6: OperatorFunction<OP5, OP6>, op7: OperatorFunction<OP6, OP7>, op: OperatorFunction<OP7, Record<K, R>>): InjectEvent<T, E, K, R>
// // export function event<T extends Node, E, ET extends string, K extends string, OP1, OP2, OP3, OP4, OP5, OP6, OP7, OP8, R>(eventType: ET, op1: OperatorFunction<HTMLElementEvent<T, ET>, OP1>, op2: OperatorFunction<OP1, OP2>, op3: OperatorFunction<OP2, OP3>, op4: OperatorFunction<OP3, OP4>, op5: OperatorFunction<OP4, OP5>, op6: OperatorFunction<OP5, OP6>, op7: OperatorFunction<OP6, OP7>, op8: OperatorFunction<OP7, OP8>, op: OperatorFunction<OP8, Record<K, R>>): InjectEvent<T, E, K, R>
// // tslint:enable: max-line-length

// export function event<T extends Node, E, ET extends string, EV>(
//   eventType: ET | Observable<EV> | ((node: T) => Observable<EV>),
//   ...operators: OperatorFunction<any, any>[]
// ): ComponentOperatorOld<T, E, E | EV> {
//   return undefined;
// }

// class TestEvent<T> {}
// class AnotherTestEvent {}

// function tuple<T extends any[]>(...args: T): T {
//   return args;
// }

// // const tup = tuple(new TestEvent(), new AnotherTestEvent(), 1, '2', false);

// // type typType = ArrayType<typeof tup>;

// const childComps = tuple(
//   'test',
//   1,
//   div().pipe(event(of('test'))),
//   div().pipe(event(of(true))),
//   div().pipe(event(of(1))),
//   // div().pipe(event(of(new TestEvent()))),
//   // div().pipe(event(of(new AnotherTestEvent()))),
//   div().pipe(event(of([true]))),
// );

// type ChildComponentsType = ChildEvents<typeof childComps>;

// const test = div().pipe(
//   // event('click'),
//   // event(of(new TestEvent())),
//   children(
//     // div().pipe(
//     //   // children(
//     //   //   component('span').pipe(
//     //   //     event(of(true)),
//     //   //   )
//     //   // ),
//     //   event(of(new TestEvent())),
//     // ),
//     // div().pipe(
//     //   event(of(new AnotherTestEvent())),
//     // ),
//     div().pipe(
//       event(of(1)),
//     ),
//     div().pipe(
//       event(of('test')),
//     ),
//   )
// )

// type TestType = typeof test;

// ////

// // interface ComponentType<T extends Node, E> {};

// type X = [string, string[], TestEvent<number>, TestEvent<string>, AnotherTestEvent, boolean, { test: number }];

// type ElementType<T extends any[]> = T extends (infer U)[] ? U : never;

// type XElementType = ElementType<X>;

// type UnionToIntersection<U> =
//   // (U extends any ? U[] : never) extends ((infer I)[]) ? I : never
//   (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never
// type Param<T> = [T] extends [(arg: infer U) => void] ? U : never;

// type Test = Param<string | number>;

// type XUnionToIntersection = UnionToIntersection<XElementType>;

// type Union = { x: string } | { y: number } | { y: boolean };

// type Keys<T extends Record<any, any>> = T extends Record<infer K, any> ? K : never;

// type Values<T extends Record<any, any>, K extends Keys<T>> = T extends Record<K, infer V> ? V : never;

// type KeyOf<T extends Record<any, any>, K extends string> = T extends Record<K, any> ? Record<K, T[K]> : never;

// type UnionKeys = Keys<Union>;

// type KeyOfUnion = KeyOf<Union, 'y'>;

// type UnionValue = Values<Union, 'y'>;

// type RemoveUnionKey<T extends Record<any, any>, K extends string> = T extends Record<K, any> ? never : T;

// type RemoveKey = RemoveUnionKey<Union, 'y'>;

// // tslint:disable: max-line-length
// type CustomEventTypes <T extends HTMLElement, E extends Record<any, any>> = T & {
//   addEventListener<K extends Keys<E>>(type: K, listener: (this: HTMLElement, ev: CustomEvent<Values<E, K>>) => any, options?: boolean | AddEventListenerOptions): void;
//   removeEventListener<K extends Keys<E>>(type: K, listener: (this: HTMLElement, ev: CustomEvent<Values<E, K>>) => any, options?: boolean | EventListenerOptions): void;
// };
// // tslint:enable: max-line-length

// type DivWithEvents = CustomEventTypes<HTMLDivElement, Union>

// // let x: DivWithEvents;

// // x.addEventListener()
