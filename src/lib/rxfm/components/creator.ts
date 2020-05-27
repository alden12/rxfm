import { ElementType, Component, ComponentObservable } from './component';
import { ChildComponent, children, ChildEvents } from '../children/children';
import { of, Observable, OperatorFunction } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Dictionary } from '../utils';
import { ElementEventMap, EmitEvent, event } from '../events';
import { setState } from '../state';
import { IAttributes } from '../attributes';
// import { ElementAttributeMap, ElementAttributes, AttributeEvents, EventOperators } from '../attributes';

export type EventOperators<E> = {
  [K in keyof ElementEventMap]?: OperatorFunction<ElementEventMap[K], E>;
}

// const a: EventOperators<any> = {
//   click: setState(e => e),
//   foo: 'bar',
// };

// export interface IAttributes extends EventOperators<any> {
//   class?: string | Observable<string>;
//   styles?: Dictionary<string> | Observable<Dictionary<string>>;
//   attributes?: Dictionary<string> | Observable<Dictionary<string>>;
// }

export type AttributeEvents<T extends EventOperators<any>> = T extends EventOperators<infer E> ?
  E extends EmitEvent<infer ET, infer EV> ? Record<ET, EV> : never : never;

// function inputAttributes <T extends IAttributes, E extends keyof ElementAttributes>(
//   attributes: T & ElementAttributes[E],
//   type: E
// ): AttributeEvents<T> {
//   return {};
// }

// const test = inputAttributes({ click: setState(e => e), disabled: 'true' }, 'input' as const)

// export type ElementAttributes<T extends string> = T extends keyof ElementAttributeMap ?
//   Partial<ElementAttributeMap[T]> : Partial<GlobalAttributes>;


// interface Foo {
//   bar?: string;
//   baz?: boolean;
// }

// function foo<A extends EventOperators<any> & IAttributes>(
//   attributes: A,
//   ...args: any[]
// ): ComponentObservable<any, AttributeEvents<A>> {
//   return;
// }

// const test = foo({ click: setState(e => e), type: 'radio', foo: 1 }, 'test');

// export interface ComponentAttributes<P extends object> {
//   props?: Partial<P>;
// };

/**
 * A function to create a component of type T.
 */
export type ComponentCreatorFunction<T extends ElementType, E extends Record<string, any> = never> = {
  (): ComponentObservable<T, E>;
  <A extends EventOperators<any>>(attributes: A & IAttributes): ComponentObservable<T, E | AttributeEvents<A>>;
  <C0 extends ChildComponent<ElementType, any>, C extends ChildComponent<ElementType, any>[]>(
    childComponent: C0,
    ...childComponents: C
  ): ComponentObservable<T, E | ChildEvents<[C0]> | ChildEvents<C>>;
  <A extends EventOperators<any>, C extends ChildComponent<ElementType, any>[]>(
    attributes: A & IAttributes,
    ...childComponents: C
  ): ComponentObservable<T, E | ChildEvents<C> | AttributeEvents<A>>;
};

export type ComponentFromChildren<T extends ElementType, E extends Record<string, any> = never> =
  <C extends ChildComponent[] = []>(children: C) => ComponentObservable<T, E | ChildEvents<C>>;

export function getComponentCreator<T extends ElementType, E extends Record<string, any> = never>(
  componentFunction: ComponentFromChildren<T, E>,
): ComponentCreatorFunction<T, E> {

  function componentCreator(): ComponentObservable<T, E>
  function componentCreator<A extends EventOperators<any>>(
    attributes: A & IAttributes,
  ): ComponentObservable<T, E | AttributeEvents<A>>
  function componentCreator<C0 extends ChildComponent<ElementType, any>, C extends ChildComponent<ElementType, any>[]>(
    childComponent: C0,
    ...childComponents: C
  ): ComponentObservable<T, E | ChildEvents<[C0]> | ChildEvents<C>>
  function componentCreator<A extends EventOperators<any>, C extends ChildComponent<ElementType, any>[]>(
    attributes: A & IAttributes,
    ...childComponents: C
  ): ComponentObservable<T, E | ChildEvents<C> | AttributeEvents<A>>
  function componentCreator(
    attributes?: EventOperators<any> & IAttributes | ChildComponent<ElementType, any>,
    ...childComponents: ChildComponent<ElementType, any>[]
  ): ComponentObservable<T, any> {

    const _childComponents = (attributes instanceof Observable || typeof attributes !== 'object') ?
      [attributes, ...childComponents] : childComponents;
    const _attributes = (attributes instanceof Observable || typeof attributes !== 'object' || !attributes) ? {} : attributes;

    return of(componentFunction).pipe(
      map(compFn => compFn(_childComponents)),
      switchMap(comp => Object.keys(_attributes)
      .filter(key => typeof _attributes[key] === 'function')
      .reduce((c, key) => c.pipe(
        event(key, _attributes[key] as OperatorFunction<Event, any>)
      ), comp)),
    );
  }

  return componentCreator;
}

// export function componentFactory<T extends ElementType>(
//   elementCreationFunction: () => T,
// ): ComponentCreator<T> {

//   function createComponent(): ComponentObservable<T>
//   function createComponent<A extends EventOperators<any>>(
//     attributes: A & IAttributes,
//   ): ComponentObservable<T, AttributeEvents<A>>
//   function createComponent<C0 extends ChildComponent<ElementType, any>, C extends ChildComponent<ElementType, any>[]>(
//     childComponent: C0,
//     ...childComponents: C
//   ): ComponentObservable<T, ChildEvents<[C0]> | ChildEvents<C>>
//   function createComponent<A extends EventOperators<any>, C extends ChildComponent<ElementType, any>[]>(
//     attributes: A & IAttributes,
//     ...childComponents: C
//   ): ComponentObservable<T, ChildEvents<C> | AttributeEvents<A>>
//   function createComponent(
//     attributes?: EventOperators<any> & IAttributes | ChildComponent<ElementType, any>,
//     ...childComponents: ChildComponent<ElementType, any>[]
//   ): ComponentObservable<T, any> {

//     const _childComponents = (attributes instanceof Observable || typeof attributes !== 'object') ?
//       [attributes, ...childComponents] : childComponents;
//     const _attributes = (attributes instanceof Observable || typeof attributes !== 'object' || !attributes) ? {} : attributes;

//     return of(elementCreationFunction).pipe(
//       map(elementFn => new Component(elementFn())),
//       children(..._childComponents),
//       switchMap(component => Object.keys(_attributes)
//         .filter(key => typeof _attributes[key] === 'function')
//         .reduce((component$, key) => component$.pipe(
//           event(key, _attributes[key] as OperatorFunction<Event, any>)
//         ), of(component))
//       ),
//     );
//   }

//   return createComponent;
// }

// type EventTypes<T extends EventOperators> = {
//   [K in keyof T]: T[K] extends OperatorFunction<any, EmitEvent<infer EK, infer EV>> ? Record<EK, EV> : never;
// }

// interface EventsTest {
//   click: (click$: Observable<MouseEvent>) => Observable<EmitEvent<'test', number>>;
//   contextmenu: (click$: Observable<MouseEvent>) => Observable<EmitEvent<'test1', boolean>>;
//   change: (click$: Observable<MouseEvent>) => Observable<boolean>;
// }

// type InferTest = AttributeEvents<EventsTest>;

// const attribute: IAttributes = {
//   click: setState(ev => ev.screenX),
//   class: 'test',
// };

// function withAttributes<B extends any[]>(
//   foo1: number,
//   ...foo: B
// ): undefined
// function withAttributes<T extends IAttributes, B extends any[]>(
//   _attribute: T | B,
//   ...foo: B
// ): AttributeEvents<T>
// function withAttributes<T extends IAttributes, B extends any[]>(
//   _attribute: T,
//   ...foo: B
// ): AttributeEvents<T> {
//   return {};
// }

// const attributeTest = withAttributes({
//   click: setState(ev => ev.screenX),
//   // class: 'test',
// }, ['test']);

// interface Classes {
//   class?: Observable<string>;
// }

// type ArgTypes = EventOperators<any> & Classes & Partial<Dictionary<string>>;

// type ComponentArgs<T extends ArgTypes> = {
//   [K in keyof T]: K extends keyof ElementEventMap ? OperatorFunction<ElementEventMap[K], any> :
//     K extends keyof Classes ? Classes[K] : string;
// }

// function componentArgs<T extends ArgTypes>(
//   attributes: ComponentArgs<T>,
// ): EventTypes<ComponentArgs<T>> {
//   return {};
// }

// const inferTest = componentArgs({
//   click: setState(ev => ev.screenX),
// });
