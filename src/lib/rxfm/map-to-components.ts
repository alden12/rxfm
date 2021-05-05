import { Observable, OperatorFunction, from, of } from 'rxjs';
import { ElementType, Component } from './components';
import { map, filter, startWith, mergeAll, distinctUntilChanged, switchMap, takeUntil, tap, shareReplay } from 'rxjs/operators';
import { select } from './utils';

type Id = string | number;

interface ItemAndIndex<T> {
  item: T;
  index: number;
}

interface ItemDiff<T> {
  added: Id[];
  removed: Set<Id>;
  itemMap: Map<Id, ItemAndIndex<T>>;
}

function itemDiffer<T>(idFunction: (item: T, index: number) => Id): OperatorFunction<T[], ItemDiff<T>> {
  return (items$: Observable<T[]>) => {
    let previousItemMap = new Map<Id, ItemAndIndex<T>>();
    return items$.pipe(
      map(items => {
        const itemsAndIds = items.map((item, index) => {
          const id = idFunction(item, index);
          if (typeof id !== 'string' && typeof id !== 'number') {
            throw new TypeError(
              `Invalid id function passed to mapToComponents, must return string or number, got: ${typeof id}.`,
            );
          }
          return [id, { item, index }] as const
        });
        const added = itemsAndIds.filter(([id]) => !previousItemMap.has(id)).map(([id]) => id)
        const itemMap = new Map(itemsAndIds);
        const removed = new Set(Array.from(previousItemMap.keys()).filter(id => !itemMap.has(id)));
        previousItemMap = itemMap;
        return { added, removed, itemMap };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }
}

interface ComponentDiff<I, T extends ElementType> {
  newComponents: [I, Component<T>][];
  removedIds: I[];
  ids: I[];
}

function createComponents<I, T extends ElementType>(
  creationFunction: (item: Observable<I>, index: Observable<number>) => Component<T>,
): OperatorFunction<ItemDiff<I>, ComponentDiff<Id, T>> {
  return (changes: Observable<ItemDiff<I>>) => changes.pipe(
    map(({ added, removed, itemMap }) => {

      const newComponents = added.map(id => {
        const itemAndIndexUpdates = changes.pipe(
          filter(({ itemMap }) => itemMap.has(id)),
          map(({ itemMap }) => itemMap.get(id)!),
          distinctUntilChanged(),
        );
        const componentObservable = creationFunction(
          itemAndIndexUpdates.pipe(select('item')),
          itemAndIndexUpdates.pipe(select('index')),
        ).pipe(
          takeUntil(changes.pipe(
            filter(diff => diff.removed.has(id)),
          )),
        );
        return [id, componentObservable] as [Id, Component<T>];
      });

      return {
        newComponents,
        removedIds: Array.from(removed),
        ids: Array.from(itemMap.keys()),
      };
    })
  );
}

function combineComponents<I, T extends ElementType>(
): OperatorFunction<ComponentDiff<I, T>, ElementType[]> {
  return (componentObservableChanges: Observable<ComponentDiff<I, T>>) => {

    const elementMap = new Map<I, ElementType>();
    return componentObservableChanges.pipe(
      switchMap(({ newComponents, removedIds, ids }) => {
        removedIds.forEach(id => elementMap.delete(id));
        return from([
          ...newComponents.map(([id, component]) => component.pipe(
            tap(element => elementMap.set(id, element)),
          )),
          of(ids),
        ]);
      }),
      mergeAll(),
      filter(elementOrIds => Array.isArray(elementOrIds)),
      map((ids: I[]) => ids.map(id => elementMap.get(id)!)),
    );
  }
}

function simpleComponentDiffer<I, T extends ElementType>(
  creationFunction: (item: I) => Component<T>,
): OperatorFunction<I[], ComponentDiff<I, T>> {
  return (items$: Observable<I[]>) => {

    let previousComponentMap = new Map<I, Component<T>>();
    return items$.pipe(
      map(items => {
        const componentArray = items.map(item => [item, previousComponentMap.get(item) || creationFunction(item)] as const);
        const componentMap = new Map(componentArray);
        const newComponents = items
          .filter(item => !previousComponentMap.has(item))
          .map(item => [item, componentMap.get(item)!] as [I, Component<T>]);
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
export function mapToComponents<I, T extends ElementType>(
  idFunction: (item: I, index: number) => Id,
  creationFunction: (item: Observable<I>, index: Observable<number>) => Component<T>,
): OperatorFunction<I[], ElementType[]>
export function mapToComponents<I, T extends ElementType>(
  staticCreationFunction: (item: I) => Component<T>,
): OperatorFunction<I[], ElementType[]>
export function mapToComponents<I, T extends ElementType>(
  idOrCreationFunction: ((item: I, index: number) => Id) | ((item: I) => Component<T>),
  creationFunction?: (item: Observable<I>, index: Observable<number>) => Component<T>,
): OperatorFunction<I[], ElementType[]> {
  if (creationFunction) {
    return (items: Observable<I[]>) => items.pipe(
      itemDiffer(idOrCreationFunction as (item: I, index: number) => Id),
      createComponents(creationFunction),
      combineComponents(),
      startWith([]),
    );
  }
  return (items: Observable<I[]>) => items.pipe(
    simpleComponentDiffer(idOrCreationFunction as (item: I) => Component<T>),
    combineComponents(),
    startWith([]),
  );
}
