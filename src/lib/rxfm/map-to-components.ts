import { Observable, OperatorFunction, from, of } from 'rxjs';
import { ElementType, Component } from './components';
import { map, filter, startWith, mergeAll, distinctUntilChanged, switchMap, takeUntil, tap, shareReplay } from 'rxjs/operators';
import { selectFrom } from './utils';

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
          return [id, { item, index }] as const
        });
        // Find any added items which were not present in the previous item map.
        const added = itemsAndIds.filter(([id]) => !previousItemMap.has(id)).map(([id]) => id);
        const itemMap = new Map(itemsAndIds);
        // Create a set of removed items which were in the previous item map but are not present in the new item map.
        const removed = new Set(Array.from(previousItemMap.keys()).filter(id => !itemMap.has(id)));
        previousItemMap = itemMap; // Save the current item map for the next emission.
        return { added, removed, itemMap };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }), // Share to prevent duplication, replay to allow fetching of current state.
    );
  }
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
 * An observable operator taking the diff of an item array and mapping it to a component array for each item.
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
      map((ids: I[]) => ids.map(id => elementMap.get(id)!)), // Map the current id array to an array of their elements.
    );
  }
}

/**
 * An observable operator taking an array of items and mapping them directly to a component diff. Items ids are not
 * checked and a new component will be created for each new item.
 * @param creationFunction A function taking an item of type I and returning a new component.
 */
function simpleComponentDiffer<I, T extends ElementType>(
  creationFunction: (item: I) => Component<T>,
): OperatorFunction<I[], ComponentDiff<I, T>> {
  return (items$: Observable<I[]>) => {
    // Hold previous item map for future reference.
    let previousComponentMap = new Map<I, Component<T>>();
    return items$.pipe(
      map(items => {
        // Map items to an array of components, new components will be created for any items not in the item map.
        const componentArray = items.map(item => [item, previousComponentMap.get(item) || creationFunction(item)] as const);
        const componentMap = new Map(componentArray);
        const newComponents = items // Create an array components which were not in the previous item map.
          .filter(item => !previousComponentMap.has(item))
          .map(item => [item, componentMap.get(item)!] as [I, Component<T>]);
        // Create an array of ids which are no longer present in the new component map.
        const removedIds = Array.from(previousComponentMap.keys()).filter(item => !componentMap.has(item));
        previousComponentMap = componentMap; // Save the current component map for the next emission.
        return { newComponents, removedIds, ids: items };
      }),
    );
  };
}

/**
 * An observable operator to map an array of items of type I to an array of component elements.
 * Items with matching ids between emissions will be passed to existing components rather than
 * regenerating them to more efficiently render.
 * @param idFunction A function taking an item of type I and returning it's unique id.
 * (If the creation function is passed here instead then item values will be used as their ids directly and the creation
 * function will take a non-observable item.)
 * @param creationFunction A function taking an item observable (and current item index observable if needed)
 * and returning a new component for the item.
 */
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
