import {  ComponentOperator, ElementType } from "rxfm";
import { Observable, of, ReplaySubject } from "rxjs";
import { startWith, switchAll, tap } from "rxjs/operators";
import { componentOperator } from "./components";
import { operatorIsolationService } from "./operator-isolation-service";
import { coerceToObservable, identity } from "./utils";

type ContextConsumer<T> = readonly [
  register: <E extends ElementType>() => ComponentOperator<E>,
  valueObservable: Observable<T>,
];

type ContextMethods<T> = readonly [
  provider: <E extends ElementType>(value: T | Observable<T>) => ComponentOperator<E>,
  context: () => ContextConsumer<T>,
];

const noDefaultValueSymbol = Symbol("No default context value");

export function createContext<T>(defaultValue?: T): ContextMethods<T>;
export function createContext<T>(defaultValue: T | symbol = noDefaultValueSymbol): ContextMethods<T> {
  const symbol = Symbol('Context Symbol');

  const provider = <E extends ElementType>(value: T | Observable<T>) => componentOperator<E, null>(element => of(null).pipe(
    tap(() => operatorIsolationService.setProvider(symbol, element, coerceToObservable(value))),
  ));

  const context = () => {
    const valueSubject = new ReplaySubject<Observable<T>>(1);
    const value = valueSubject.pipe(
      switchAll(),
      (defaultValue === noDefaultValueSymbol ? identity : startWith(defaultValue as T)),
    );

    const register = <E extends ElementType>() => componentOperator<E, null>(element => of(null).pipe(
      tap(() => {
        const provider: Observable<T> | undefined = operatorIsolationService.getProvider(symbol, element);
        if (!provider) throw new Error(`No matching provider found for element: ${element}. ` +
          `Ensure that a parent component has been piped though the context's provider operator, ` +
          `and that the provider operator comes later in the chain than the parent elements children operator ` +
          `(default behavior when using JSX syntax).`);
        valueSubject.next(provider);
      }),
    ));
    return [register, value] as const;
  };

  return [provider, context];
}
