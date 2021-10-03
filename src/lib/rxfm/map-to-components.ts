import { Observable, OperatorFunction, from, of } from 'rxjs';
import { ElementType, Component } from './components';
import { map, filter, startWith, mergeAll, distinctUntilChanged, switchMap, takeUntil, tap, shareReplay } from 'rxjs/operators';
import { KeysOfValue, selectFrom } from './utils';

type Id = string | number;

interface ItemAndIndex<T> {
  item: T;
  index: number;
}

/**
 * The difference between two states of an array of items of type T.
 */
interface ItemDiff<T> {
  added: Id[];
  removed: Set<Id>;
  itemMap: Map<Id, ItemAndIndex<T>>;
}

/**
 * An observable operator function to find the difference between consecutive emissions of arrays of type T.
 * @param idFunction A function taking an item and returning it's unique id.
 * @returns An operator function mapping T[] emissions to ItemDiff difference objects.
 */
function itemDiffer<T>(idFunction: (item: T, index: number) => Id): OperatorFunction<T[], ItemDiff<T>> {
  return (items$: Observable<T[]>) => {
    let previousItemMap = new Map<Id, ItemAndIndex<T>>(); // Hold previous item map for future reference.
    return items$.pipe(
      map(items => {
        const itemsAndIds = items.map((item, index) => { // Map items to an array of items, indexes, and their corresponding ids.
          const id = idFunction(item, index); // Get item id.
          if (typeof id !== 'string' && typeof id !== 'number') {
            throw new TypeError( // If id is not of correct type, throw error.
              `Invalid id function passed to mapToComponents, must return string or number, got: ${typeof id}.`,
            );
          }
          return [id, { item, index }] as const;
        });
        // Find any added items which were not present in the previous item map.
        const added = itemsAndIds.filter(([id]) => !previousItemMap.has(id)).map(([id]) => id);
        const itemMap = new Map(itemsAndIds);
        // Create a set of removed item ids which were in the previous item map but are not present in the new item map.
        const removed = new Set(Array.from(previousItemMap.keys()).filter(id => !itemMap.has(id)));
        previousItemMap = itemMap; // Save the current item map for the next emission.
        return { added, removed, itemMap };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }), // Share to prevent duplication, replay to allow fetching of current state.
    );
  };
}

/**
 * The difference between two states of a component array.
 */
interface ComponentDiff<I, T extends ElementType> {
  newComponents: [I, Component<T>][];
  removedIds: I[];
  ids: I[];
}

/**
 * An observable operator taking the diff of an item array and mapping it to a component array corresponding to each item.
 * @param creationFunction A function taking an item of type T and returning a component.
 * @returns An operator function mapping a T array diff onto an array of components for each item.
 */
function createComponents<I, T extends ElementType>(
  creationFunction: (item: Observable<I>, index: Observable<number>) => Component<T>,
): OperatorFunction<ItemDiff<I>, ComponentDiff<Id, T>> {
  return (changes: Observable<ItemDiff<I>>) => changes.pipe(
    map(({ added, removed, itemMap }) => {
      // Create an array of new components for each added item.
      const newComponents = added.map(id => {
        // Create an observable emitting the item and index with the correct id.
        const itemAndIndexUpdates = changes.pipe(
          filter(({ itemMap }) => itemMap.has(id)),
          map(({ itemMap }) => itemMap.get(id)!),
          distinctUntilChanged(),
        );
        // Create a new component for the added item and pass it the corresponding item and index observables.
        const componentObservable = creationFunction(
          selectFrom(itemAndIndexUpdates, 'item'),
          selectFrom(itemAndIndexUpdates, 'index'),
        ).pipe(
          takeUntil(changes.pipe( // Remove the component from the stream when it is removed from the source array.
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

/**
 * @returns An observable operator taking a component diff and mapping it to an array of elements for each currently active
 * component.
 */
function combineComponents<I, T extends ElementType>(
): OperatorFunction<ComponentDiff<I, T>, ElementType[]> {
  return (componentObservableChanges: Observable<ComponentDiff<I, T>>) => {

    const elementMap = new Map<I, ElementType>(); // Create a map to keep track of each component's element.
    return componentObservableChanges.pipe(
      switchMap(({ newComponents, removedIds, ids }) => {
        removedIds.forEach(id => elementMap.delete(id)); // Delete any removed elements from the map.
        // Map to an observable emitting each new component and ending with and array of component ids.
        return from([
          ...newComponents.map(([id, component]) => component.pipe(
            tap(element => elementMap.set(id, element)), // Add the new element into the map upon subscription.
          )),
          of(ids), // End with the current array of component ids.
        ]);
      }),
      mergeAll(), // Merge all component and id array emissions.
      filter(elementOrIds => Array.isArray(elementOrIds)), // Only allow the id array emissions through.
      map(ids => (ids as I[]).map(id => elementMap.get(id)!)), // Map the current id array to an array of their elements.
    );
  };
}

/**
 * An observable operator to map an array of items of type I to an array of component elements.
 * Items with matching ids between emissions will be passed to existing components rather than
 * regenerating them to more efficiently render.
 * @param creationFunction A function taking an item observable (and current item index observable if needed)
 * @param idFunction Either: a function taking an item of type I and returning it's unique id,
 * A prop name of I in which it's unique id can be found, or if omitted then the item index will be used as the id.
 * and returning a new component for the item.
 */
export function mapToComponents<I, T extends ElementType>(
  creationFunction: (item: Observable<I>, index: Observable<number>) => Component<T>,
): OperatorFunction<I[], ElementType[]>;
export function mapToComponents<I, T extends ElementType>(
  creationFunction: (item: Observable<I>, index: Observable<number>) => Component<T>,
  idFunction: (item: I) => Id,
): OperatorFunction<I[], ElementType[]>;
export function mapToComponents<I, T extends ElementType>(
  creationFunction: (item: Observable<I>, index: Observable<number>) => Component<T>,
  idProp: KeysOfValue<I, Id>,
): OperatorFunction<I[], ElementType[]>;
export function mapToComponents<I, T extends ElementType>(
  creationFunction: (item: Observable<I>, index: Observable<number>) => Component<T>,
  idPropOrFunction?: ((item: I, index: number) => Id) | KeysOfValue<I, Id>,
): OperatorFunction<I[], ElementType[]> {
  const idFunction: (item: I, index: number) => Id = idPropOrFunction ?
    typeof idPropOrFunction === 'function' ?
      idPropOrFunction as (item: I, index: number) => Id :
      (item) => item[idPropOrFunction] as unknown as Id :
    (_, i) => i;

  return (items: Observable<I[]>) => items.pipe(
    itemDiffer(idFunction),
    createComponents(creationFunction),
    combineComponents(),
    startWith([]),
  );
}
