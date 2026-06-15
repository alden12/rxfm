import { Observable } from "rxjs";
import { event, ElementEventMap, EventHandler } from "../events";
import {
  classes, ClassType, attribute, AttributeKeys, AttributeType, styles, Styles, StyleObject,
} from "../attributes";
import { TypeOrObservable } from "../utils";
import { Component, ComponentCreator, ComponentOperator, ElementType } from "./component";

/**
 * Fluent event methods added to an element creator. For each event name in the `ElementEventMap`
 * there is a corresponding `on<EventName>` method (eg. `onClick`, `onInput`), as well as a generic
 * `on` method taking the event type explicitly. Each returns a new chainable creator carrying the
 * added event operator, so calls may be chained: `Button.onClick(a).onMouseenter(b)`.
 */
export type EventChainMethods<T extends ElementType> = {
  // Reversible because all DOM event names are lowercase: `Capitalize<'click'>` is `'Click'`.
  [E in keyof ElementEventMap as `on${Capitalize<E>}`]:
    (handler: EventHandler<T, E>) => ChainableComponentCreator<T>;
} & {
  on<E extends keyof ElementEventMap>(type: E, handler: EventHandler<T, E>): ChainableComponentCreator<T>;
};

/**
 * Fluent CSS class method added to an element creator. `class` is sugar for the `classes` operator,
 * taking the same spread of class names (strings, observables, or observable string arrays; falsy
 * values remove the class) and returning a new chainable creator so it may be chained with other
 * methods.
 */
export type ClassChainMethods<T extends ElementType> = {
  class(...classNames: ClassType[]): ChainableComponentCreator<T>;
};

/**
 * Fluent styles method added to an element creator. `style` is sugar for the `styles` operator,
 * taking a styles dictionary (or observable emitting one) and returning a new chainable creator.
 */
export type StyleChainMethods<T extends ElementType> = {
  style(styleDict: Styles | Observable<StyleObject>): ChainableComponentCreator<T>;
};

/**
 * Fluent attribute methods added to an element creator. For each known attribute name there is a
 * corresponding method (eg. `Input.type('text')`, `Div.id('app')`) which is sugar for the
 * equivalent `attribute` operator and returns a new chainable creator so calls may be chained. The
 * generic `attr(name, value)` method covers attributes not in the typed map (`data-*`, `aria-*`,
 * and other custom attributes).
 */
export type AttributeChainMethods<T extends ElementType> = {
  [K in AttributeKeys]: (value: TypeOrObservable<AttributeType>) => ChainableComponentCreator<T>;
} & {
  attr(name: string, value?: TypeOrObservable<AttributeType>): ChainableComponentCreator<T>;
};

/**
 * An element creator which, in addition to the standard call and tagged template syntax for
 * providing children, exposes fluent methods which apply the equivalent component operator via
 * `.pipe`. Sugar is provided for events (`Div.onClick(handler)` → the `event` operator), CSS classes
 * (`Div.class('x')` → `classes`), styles (`Div.style({ color: 'red' })` → `styles`), and individual
 * attributes (`Input.type('text')` → the `attribute` operator). All methods return a chainable
 * creator, so they may be chained, eg: `` Input.type('text').onInput(handler).class('field')`` ``.
 */
export type ChainableComponentCreator<T extends ElementType = ElementType> =
  ComponentCreator<T>
  & EventChainMethods<T>
  & ClassChainMethods<T>
  & StyleChainMethods<T>
  & AttributeChainMethods<T>;

/**
 * Wrap a component creator so that it gains fluent operator methods (events such as `onClick`, plus
 * `class`, `style`, and per-attribute methods like `id` or `type`) in addition to its existing call
 * and tagged template syntax. Each method appends the equivalent component operator and returns a
 * new chainable creator, so calls may be chained. The accumulated operators are applied (via
 * `.pipe`) once children are provided by the terminal call or tagged template.
 * @param create The base component creator to make chainable.
 * @param ops The operators accumulated so far in the chain (used internally; defaults to none).
 * @returns A chainable component creator of type T.
 */
export function chainable<T extends ElementType>(
  create: ComponentCreator<T>,
  ops: ComponentOperator<T>[] = [],
): ChainableComponentCreator<T> {
  // `build` is callable and taggable: it forwards all arguments to the base creator unchanged
  // (which already routes between the TemplateStringsArray and children forms) then applies any
  // accumulated operators.
  const build = (...args: unknown[]) => {
    const component = (create as (...a: unknown[]) => Component<T>)(...args);
    return ops.reduce((result, op) => result.pipe(op), component);
  };

  const next = (op: ComponentOperator<T>) => chainable<T>(create, [...ops, op]);

  return new Proxy(build, {
    get(target, prop, receiver) {
      // Only string keys which aren't already function members (name, length, bind, …) are treated
      // as fluent methods. `then` is excluded so the builder is never mistaken for a thenable.
      if (typeof prop === 'string' && prop !== 'then' && !(prop in target)) {
        if (prop === 'class') {
          return (...classNames: ClassType[]) => next(classes<T>(...classNames));
        }
        if (prop === 'style') {
          return (styleDict: Styles | Observable<StyleObject>) => next(styles<T>(styleDict));
        }
        if (prop === 'on') {
          return (type: keyof ElementEventMap, handler: EventHandler<T, keyof ElementEventMap>) =>
            next(event(type, handler));
        }
        if (/^on[A-Z]/.test(prop)) {
          const type = (prop[2].toLowerCase() + prop.slice(3)) as keyof ElementEventMap;
          return (handler: EventHandler<T, keyof ElementEventMap>) => next(event(type, handler));
        }
        if (prop === 'attr') {
          return (name: string, value?: TypeOrObservable<AttributeType>) =>
            next(attribute(name, value));
        }
        // Any other name is an individual attribute: `Input.type('text')` → `attribute('type', …)`.
        return (value: TypeOrObservable<AttributeType>) => next(attribute(prop, value));
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as unknown as ChainableComponentCreator<T>;
}
