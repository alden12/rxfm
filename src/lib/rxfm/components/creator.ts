import { ElementType, Component } from './component';
import { ChildComponent, ChildEvents } from '../children/children';
import { of, Observable, OperatorFunction } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { filterObject, coerceToArray, flatten } from '../utils';
import { ElementEventMap, EmitEvent, event, EventType, EventDelete } from '../events';
import { SetState, stateful } from '../state';
import { IAttributes } from '../attributes';

export type EventOperators<E = unknown> = {
  [K in keyof ElementEventMap]?: OperatorFunction<ElementEventMap[K], E> | OperatorFunction<ElementEventMap[K], E>[];
}

export type AttributeEvents<T extends EventOperators> = T extends EventOperators<infer E> ?
  E extends EmitEvent<infer ET, infer EV> ? EventType<ET, EV> : never : never;

/**
 * A function to create a component of type T.
 */
export type ComponentCreatorFunction<T extends ElementType, E extends EventType = never> = {
  (): Component<T, E>;
  <A extends EventOperators<unknown>>(attributes: A & IAttributes): Component<T, E | AttributeEvents<A>>;
  <C0 extends ChildComponent<ElementType, any>, C extends ChildComponent<ElementType, any>[]>(
    childComponent: C0,
    ...childComponents: C
  ): Component<T, E | ChildEvents<[C0]> | ChildEvents<C>>;
  <A extends EventOperators<unknown>, C extends ChildComponent<ElementType, any>[]>(
    attributes: A & IAttributes,
    ...childComponents: C
  ): Component<T, E | ChildEvents<C> | AttributeEvents<A>>;
};

export interface IComponentArgs<C extends ChildComponent[]> {
  children: C;
  attributes: IAttributes;
}

export interface IStatefulComponentArgs<C extends ChildComponent[], S> extends IComponentArgs<C> {
  state: Observable<S>;
}

export type ComponentFunction<T extends ElementType, E extends EventType = never> =
  <C extends ChildComponent[] = []>(args: IComponentArgs<C>) => Component<T, E | ChildEvents<C>>;

export type StatefulComponentFunction<T extends ElementType, E extends EventType = never, S = never> =
  <C extends ChildComponent[] = []>(args: IStatefulComponentArgs<C, S>) =>
    Component<T, EventType<SetState, Partial<S>> | EventDelete<E, SetState> | ChildEvents<C>>;

const isEventOperator = <T>(value: T): boolean =>
  typeof value === 'function' || (Array.isArray(value) && value.every(item => typeof item === 'function'));

export function component<T extends ElementType, E extends EventType = never>(
  componentFunction: ComponentFunction<T, E>,
): ComponentCreatorFunction<T, E>
export function component<T extends ElementType, S, E extends EventType = never>(
  componentFunction: StatefulComponentFunction<T, E, S>,
  initialState: S,
): ComponentCreatorFunction<T, EventDelete<E, SetState>>
export function component<T extends ElementType, S, E extends EventType = never>(
  componentFunction: ComponentFunction<T, E> | StatefulComponentFunction<T, E, S>,
  initialState?: S,
): ComponentCreatorFunction<T, E> {

  function componentCreator(): Component<T, E>
  function componentCreator<A extends EventOperators<any>>(
    attributes: A & IAttributes,
  ): Component<T, E | AttributeEvents<A>>
  function componentCreator<C0 extends ChildComponent<ElementType, any>, C extends ChildComponent<ElementType, any>[]>(
    childComponent: C0,
    ...childComponents: C
  ): Component<T, E | ChildEvents<[C0]> | ChildEvents<C>>
  function componentCreator<A extends EventOperators<any>, C extends ChildComponent<ElementType, any>[]>(
    attributes: A & IAttributes,
    ...childComponents: C
  ): Component<T, E | ChildEvents<C> | AttributeEvents<A>>
  function componentCreator(
    attributes?: EventOperators<any> & IAttributes | ChildComponent<ElementType, any>,
    ...childComponents: ChildComponent<ElementType, any>[]
  ): Component<T, any> {

    const _childComponents = (attributes instanceof Observable || typeof attributes !== 'object') ?
      [attributes, ...childComponents] : childComponents;
    const _attributes = (attributes instanceof Observable || typeof attributes !== 'object' || !attributes) ? {} : attributes;

    return of(componentFunction).pipe(
      map(compFn => {
        const staticAttributes = filterObject(_attributes, val => !isEventOperator(val));
        if (initialState) {
          const coFn: StatefulComponentFunction<T, E, S> = compFn;
          return stateful(initialState, state => coFn({ state, children: _childComponents, attributes: staticAttributes }));
        } else {
          const coFn: ComponentFunction<T, E> = compFn as ComponentFunction<T, E>;
          return coFn({ children: _childComponents, attributes: staticAttributes });
        }
      }),
      switchMap(comp => {
        const eventKeys = Object.keys(_attributes)
          .filter(key => isEventOperator(_attributes[key])) as (keyof ElementEventMap)[];
        const operators = flatten(eventKeys.map(key => coerceToArray(_attributes[key]!).map(op => ({ key, op }))));
        return operators.reduce<Component<T, any>>((c, { key, op }) => c.pipe(
          event(key, op as OperatorFunction<Event, any>)
        ), comp);
      }),
    );
  }

  return componentCreator;
}
