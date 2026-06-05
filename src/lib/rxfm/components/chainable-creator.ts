import { event, ElementEventMap, EventHandler } from "../events";
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
 * An element creator which, in addition to the standard call and tagged template syntax for
 * providing children, exposes fluent event methods (`Div.onClick(handler)`). These are sugar for
 * applying the equivalent `event` operator via `.pipe`, eg: `` Div.onClick(handler)`text` `` is
 * equivalent to `` Div`text`.pipe(event.click(handler)) ``.
 */
export type ChainableComponentCreator<T extends ElementType = ElementType> =
  ComponentCreator<T> & EventChainMethods<T>;

/**
 * Wrap a component creator so that it gains fluent event methods (`onClick`, `onInput`, …, and the
 * generic `on(type, handler)`) in addition to its existing call and tagged template syntax.
 * Each event method appends the equivalent `event` operator and returns a new chainable creator, so
 * the calls may be chained. The accumulated operators are applied (via `.pipe`) once children are
 * provided by the terminal call or tagged template.
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

  return new Proxy(build, {
    get(target, prop, receiver) {
      if (typeof prop === 'string') {
        if (prop === 'on') {
          return (type: keyof ElementEventMap, handler: EventHandler<T, keyof ElementEventMap>) =>
            chainable<T>(create, [...ops, event(type, handler)]);
        }
        if (/^on[A-Z]/.test(prop)) {
          const type = (prop[2].toLowerCase() + prop.slice(3)) as keyof ElementEventMap;
          return (handler: EventHandler<T, keyof ElementEventMap>) =>
            chainable<T>(create, [...ops, event(type, handler)]);
        }
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as unknown as ChainableComponentCreator<T>;
}
