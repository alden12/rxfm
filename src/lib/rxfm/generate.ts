import { Observable, OperatorFunction, from, of } from 'rxjs';
import { ElementType, RxFMElement, Component } from './components';
import { map, filter, startWith, mergeAll, distinctUntilChanged, switchMap, takeUntil, share, tap } from 'rxjs/operators';
import { EventType } from './events';

type Id = string | number;

interface ItemDiff<T> {
  updated: Map<Id, T>;
  added: Id[];
  removed: Set<Id>;
  itemMap: Map<Id, T>;
}

function itemDiffer<T>(idFunction: (item: T) => Id): OperatorFunction<T[], ItemDiff<T>> {
  return (items$: Observable<T[]>) => {
    let previousItemMap = new Map<Id, T>();
    return items$.pipe(
      map(items => {
        const itemsAndIds = items.map(item => [idFunction(item), item] as const);
        const updated = new Map(itemsAndIds.filter(([id]) => previousItemMap.has(id)));
        const added = itemsAndIds.filter(([id]) => !previousItemMap.has(id)).map(([id]) => id)
        const itemMap = new Map(itemsAndIds);
        const removed = new Set(Array.from(previousItemMap.keys()).filter(id => !itemMap.has(id)));
        previousItemMap = itemMap;
        return { updated, added, removed, itemMap };
      }),
      share(),
    );
  }
}

interface ComponentDiff<I, T extends ElementType, E extends EventType = never> {
  newComponents: [I, Component<T, E>][];
  removedIds: I[];
  ids: I[];
}

function createComponents<T, ET extends ElementType, E extends EventType = never>(
  creationFunction: (item: Observable<T>) => Component<ET, E>,
): OperatorFunction<ItemDiff<T>, ComponentDiff<Id, ET, E>> {
  return (changes: Observable<ItemDiff<T>>) => changes.pipe(
    map(({ added, removed, itemMap }) => {

      const newComponents = added.map(id => {
        const updates = changes.pipe(
          filter(({ updated }) => updated.has(id)),
          map(({updated}) => updated.get(id) as T),
          startWith(itemMap.get(id)!),
          distinctUntilChanged(),
        );
        const componentObservable = creationFunction(updates).pipe(
          takeUntil(changes.pipe(
            filter(diff => diff.removed.has(id)),
          )),
        );
        return [id, componentObservable] as [Id, Component<ET, E>];
      });

      return {
        newComponents,
        removedIds: Array.from(removed),
        ids: Array.from(itemMap.keys()),
      };
    })
  );
}

function combineComponents<I, T extends ElementType, E extends EventType = never>(
): OperatorFunction<ComponentDiff<I, T, E>, RxFMElement<T, E>[]> {
  return (componentObservableChanges: Observable<ComponentDiff<I, T, E>>) => {

    const componentMap = new Map<I, RxFMElement<T, E>>();
    return componentObservableChanges.pipe(
      switchMap(({ newComponents, removedIds, ids }) => {
        removedIds.forEach(id => componentMap.delete(id));
        return from([
          ...newComponents.map(([id, item$]) => item$.pipe(
            tap(component => componentMap.set(id, component)),
          )),
          of(ids),
        ]);
      }),
      mergeAll(),
      filter(componentOrIds => Array.isArray(componentOrIds)),
      map((ids: I[]) => ids.map(id => componentMap.get(id)!)),
    );
  }
}

function simpleComponentDiffer<T, ET extends ElementType, E extends EventType = never>(
  creationFunction: (item: T) => Component<ET, E>,
): OperatorFunction<T[], ComponentDiff<T, ET, E>> {
  return (items$: Observable<T[]>) => {

    let previousComponentMap = new Map<T, Component<ET, E>>();
    return items$.pipe(
      map(items => {
        const componentArray = items.map(item => [item, previousComponentMap.get(item) || creationFunction(item)] as const);
        const componentMap = new Map(componentArray);
        const newComponents = items
          .filter(item => !previousComponentMap.has(item))
          .map(item => [item, componentMap.get(item)!] as [T, Component<ET, E>]);
        const removedIds = Array.from(previousComponentMap.keys()).filter(item => !componentMap.has(item));
        previousComponentMap = componentMap;
        return { newComponents, removedIds, ids: items };
      }),
    );
  };
}

// /**
//  * An observable operator to generate an array of RxFM components from an array of type T. The input is an observable
//  * emitting an array of type T and the output is an observable emitting an array of RxFM components.
//  * @param creationFunction A function taking an observable of type T and returning an RxFM component observable.
//  * @param idFunction A function taking a T object and returning a unique id for this object. This is required to prevent
//  * regeneration of components when the array is updated.
//  */
export function generate<T, ET extends ElementType, E extends EventType = never>(
  creationFunction: (item: T) => Component<ET, E>,
): OperatorFunction<T[], RxFMElement<ET, E>[]>
export function generate<T, ET extends ElementType, E extends EventType = never>(
  creationFunction: (item: Observable<T>) => Component<ET, E>,
  idFunction: (item: T) => Id,
): OperatorFunction<T[], RxFMElement<ET, E>[]>
export function generate<T, ET extends ElementType, E extends EventType = never>(
  creationFunction: (item: T | Observable<T>) => Component<ET, E>,
  idFunction?: (item: T) => Id,
): OperatorFunction<T[], RxFMElement<ET, E>[]> {
  if (idFunction) {
    return (items$: Observable<T[]>) => items$.pipe(
      itemDiffer(idFunction),
      createComponents(creationFunction as (item: Observable<T>) => Component<ET, E>),
      combineComponents(),
      startWith([]),
    );
  }
  return (items$: Observable<T[]>) => items$.pipe(
    simpleComponentDiffer(creationFunction as (item: T) => Component<ET, E>),
    combineComponents(),
    startWith([]),
  );
}
