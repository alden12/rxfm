import {  ComponentOperator, ElementType } from "rxfm";
import { EMPTY, Observable, of, pipe, ReplaySubject } from "rxjs";
import { finalize, switchAll, tap } from "rxjs/operators";
import { componentOperator } from "./components";
import { cleanup, coerceToObservable } from "./utils";

type ContextConsumer<T> = readonly [
  register: <E extends ElementType>() => ComponentOperator<E>,
  valueObservable: Observable<T>,
];

type ContextMethods<T> = readonly [
  provider: <E extends ElementType>(value: T | Observable<T>) => ComponentOperator<E>,
  context: () => ContextConsumer<T>,
];

class ProviderMap<T> {
  private providers: { element: ElementType, value: Observable<T> }[] = [];

  public getProvider(childElement: ElementType) {
    return this.providers.find(({ element }) => element.contains(childElement))?.value;
  }

  public setProvider(element: ElementType, value: Observable<T>) {
    this.providers = [{ element, value }, ...this.providers];
  }

  public deleteProvider(element: ElementType) {
    this.providers = this.providers.filter(({ element: el }) => element !== el);
  }
}

export function createContext<T>(): ContextMethods<T> {
  const providerMap = new ProviderMap<T>();
  
  const provider = <E extends ElementType>(value: T | Observable<T>) => pipe(
    componentOperator<E, null>(
      element => of(null).pipe(
        tap(() => providerMap.setProvider(element, coerceToObservable(value))),
      ),
    ),
    cleanup(el => el && providerMap.deleteProvider(el)),
  );

  const context = () => {
    const valueSubject = new ReplaySubject<Observable<T>>(1);
    const value = valueSubject.pipe(
      switchAll(),
    );

    const register = <E extends ElementType>() => pipe(
      componentOperator<E, null>(
        element => of(null).pipe(
          tap(() => {
            const provider: Observable<T> | undefined = providerMap.getProvider(element);
            if (!provider) throw new Error(`No matching provider found for element: ${element}.`);
            valueSubject.next(provider.pipe(
              finalize(() => valueSubject.complete()),
            ));
          }),
        ),
      ),
      cleanup(() => valueSubject.next(EMPTY)),
    );

    return [register, value] as const;
  };

  return [provider, context];
}
