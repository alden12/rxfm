// import { addToBody, ChildComponent, ComponentOperatorOld, HTMLElementEvent } from 'rxfm';
// import { app } from './todo';
// import { of, Observable, EMPTY, OperatorFunction } from 'rxjs';
// import { map } from 'rxjs/operators';

// tslint:disable-next-line: max-line-length
import { div, children, addToBody, event, input, EmitEvent, select, setState, stateful, emitEvent, selectFrom, generate, Component, span } from 'rxfm';
import { map, tap } from 'rxjs/operators';
import { interval, Observable, EMPTY, of } from 'rxjs';

// export type ArrayType<T extends any[]> = T extends (infer A)[] ? A : never;

// // export type ChildEvent<T extends ChildComponent<ElementType, any>> =
// //   T extends ChildComponent<infer _, infer E> ? E : false;

// export type ChildEvents<T extends ChildComponent<ElementType, any>[]> = ArrayType<{
//   [P in keyof T]: T[P] extends ChildComponent<infer _, infer E> ? E : never;
// }>;

// export type ArrayType<T extends any[]> = T extends (infer A)[] ? A : never;

// export type ComponentLike<T extends ElementType, E> = Observable<EventWrapper<T, E> | EventWrapper<T, E>[]>;

// type ChildEvent<T extends ChildComponent<ElementType, any>> = T extends ComponentLike<infer _, infer E> ? E : never;

// export type ChildEvents<T extends ChildComponent<ElementType, any>[]> = ArrayType<{
//   [P in keyof T]: T[P] extends ComponentLike<infer _, infer E> ? E : never;
// }>;

// const test = div().pipe(
//   // children('another div'),
//   event('click', map(ev => new EmitEvent('foo', 'bar')))
// );
// // type Test = ArrayType<[typeof test]>
// type Test2 = ChildEvent<typeof test>;
// type Test3 = ChildEvents<[typeof test]>

// export function children2<E, C extends ChildComponent<ElementType, any>[]>(
//   ...childComponents: C
// ): ComponentOperator<HTMLDivElement, E, E | ChildEvents<C>> {
//   return undefined;
// }

// const childrenTest = children2<never, [typeof test]>(test)

// type Tuple = [number, string, boolean, unknown];

// type NoUnknown<T> = {
//   [P in keyof T]: T[P] extends unknown ? never : T[P];
// }

// type ArrType<T extends any[]> = T extends (infer A)[] ? A : never;

// type Element = NoUnknown<Tuple>

// export function stateful<T extends ElementType, S, E extends Record<SetState, Partial<S>>>(
//   initialState: S,
//   creationFunction: (state: Observable<Partial<S>>) => Observable<EventsFor<T, E>>,
// ): Observable<EventsFor<T, UnionDelete<E, SetState>>> {

// class RecordComponent<T extends keyof HTMLElementTagNameMap, E extends Record<string, any>> {
// comp: T; evs: E };

// export function stated_<S, E extends Record<SetState, Partial<S>>>(
//   initialState: S,
//   creationFunction: (state: Partial<S>) => RecordComponent<'div', E>,
// ): Observable<E> {
//   return EMPTY;
// }

// export function stated__<T extends ElementType, S, E extends Record<SetState, Partial<S>>>(
//   initialState: S,
//   creationFunction: (state: Partial<S>) => EventsFor<T, E>,
// ): Observable<EventsFor<T, EventDelete<E, SetState>>> {
//   return EMPTY;
// }

// const test = stated__({ test: true }, state => document.createElement('div') as EventsFor<HTMLDivElement, { test: number }>);

// export interface PostExtension<T extends HTMLElement> extends T {
//   events: Set<string>;
// }

interface IState { enabled: boolean, foo: string }

const statedStateless = (state: Observable<IState>) => div(
  {
    click: setState(state, ({ enabled }) => ({ enabled: !enabled }))
  },
  state.pipe(map(({ enabled }) => enabled ? 'yay' : 'nope')),
  state.pipe(select('foo')),
  selectFrom(state, 'foo')
)

// .pipe(
//   // children('thing'),
//   // children(state.pipe(map(({ enabled }) => enabled ? 'yay' : 'nope'))),
//   // event('click', setState(ev => ({ enabled: ev.timeStamp.toString() })))
// );

const stated = stateful({ enabled: false, foo: 'test' }, statedStateless);

// const app = div().pipe(
//   children(
//     'test',
//     div().pipe(
//       children('another div'),
//       event('click', map(ev => new EmitEvent('foo', 'bar')))
//     ),
//   ),
//   event('click', map(ev => new EmitEvent('test', 1))),
//   // event('foo', tap(console.log)),
// );

// app.subscribe(el => {
//   document.body.appendChild(el);
//   document.body.addEventListener('test', console.log);
// });

// addToBody(app.pipe(
//   event('test', tap(console.log)),
// ));

// tslint:disable-next-line: no-angle-bracket-type-assertion
const attributeTest = input(
  {
    class: 'test',
    contextmenu: setState(e => e),
    type: 'textarea',
    id: of('hello'),
    // foo: 1,
  },
  'test',
  'test1',
  'test2',
);

const generateTest = of([1, 2, 3, 4]).pipe(
  // generate(i => i, i => of('span').pipe(map(type => new Component(document.createElement(type)))))
  generate(i => i, i => span(i)),
);

const newChildren = div(
  {
    click: emitEvent('attribute', ev => { console.log('it worked!'); return 1 }),
  },
  div('button').pipe(
    event('click', map(ev => new EmitEvent('test2', ev.screenX))),
  ),
  'these are new children!',
  stated,
);

const test = div().pipe(
  children('new component test'),
  event('contextmenu', map(ev => { console.log(ev); return ev; })),
  event('click', emitEvent('test', ev => ev.timeStamp)),
);

const app = div().pipe(
  children(test, stated, newChildren, generateTest),
  event('test', map(ev => console.log(ev))),
  event('test2', map(ev => console.log(ev))),
);

addToBody(app);

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
