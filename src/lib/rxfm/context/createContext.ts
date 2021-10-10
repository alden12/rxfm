import {  ComponentOperator, ElementType } from "rxfm";
import { EMPTY, Observable, of, ReplaySubject } from "rxjs";
import { finalize, switchAll, tap } from "rxjs/operators";
import { Component, componentOperator } from "../components";
import { providersService } from "./providers-service";
import { coerceToObservable } from "../utils";

type ContextConsumer<T> = readonly [
  register: <E extends ElementType>() => ComponentOperator<E>,
  valueObservable: Observable<T>,
];

type ContextMethods<T> = readonly [
  provider: <E extends ElementType>(value: T | Observable<T>) => ComponentOperator<E>,
  context: () => ContextConsumer<T>,
];

const componentOperatorWithCleanup = <T extends ElementType, U>(
  effect: (element: T) => Observable<U>,
  cleanup: () => void,
) => (component: Component<T>) => componentOperator(effect)(component).pipe(
  finalize(cleanup),
);

export function createContext<T>(): ContextMethods<T> {
  const symbol = Symbol('Context Symbol');
  
  let cachedElement: ElementType | undefined;
  const provider = <E extends ElementType>(value: T | Observable<T>) => componentOperatorWithCleanup<E, null>(
    element => of(null).pipe(
      tap(() => {
        providersService.setProvider(symbol, element, coerceToObservable(value));
        cachedElement = element;
      }),
    ),
    () => cachedElement && providersService.deleteProvider(symbol, cachedElement),
  );

  const context = () => {
    const valueSubject = new ReplaySubject<Observable<T>>(1);
    const value = valueSubject.pipe(
      switchAll(),
    );

    const register = <E extends ElementType>() => componentOperatorWithCleanup<E, null>(
      element => of(null).pipe(
        tap(() => {
          const provider: Observable<T> | undefined = providersService.getProvider(symbol, element);
          if (!provider) throw new Error(`No matching provider found for element: ${element}.`);
          valueSubject.next(provider.pipe(
            finalize(() => valueSubject.complete()),
          ));
        }),
      ),
      () => valueSubject.next(EMPTY),
    );

    return [register, value] as const;
  };

  return [provider, context];
}
