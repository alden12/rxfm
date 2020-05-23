// import { Observable, combineLatest, OperatorFunction, of } from 'rxjs';
// import { map, shareReplay, filter, startWith, switchMap, debounceTime } from 'rxjs/operators';
// import { SHARE_REPLAY_CONFIG } from './utils';
// import { ComponentOld, IComponent } from './components';

import { Observable, OperatorFunction, from, of } from 'rxjs';
import { ElementType, Component, ComponentObservable } from './components';
import { map, filter, startWith, mergeAll, distinctUntilChanged, switchMap, takeUntil, share, tap } from 'rxjs/operators';

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
        const removed = new Set(Array.from(previousItemMap.keys()).filter(id => !itemMap.has(id)));
        const itemMap = new Map(itemsAndIds);
        previousItemMap = itemMap;
        return { updated, added, removed, itemMap };
      }),
      share(),
    );
  }
}

interface ComponentDiff<T extends ElementType, E extends Record<string, any> = never> {
  newComponents: [Id, ComponentObservable<T, E>][];
  removedIds: Id[];
  ids: Id[];
}

function createComponents<T, ET extends ElementType, E extends Record<string, any> = never>(
  creationFunction: (item: Observable<T>) => ComponentObservable<ET, E>,
): OperatorFunction<ItemDiff<T>, ComponentDiff<ET, E>> {
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
        return [id, componentObservable] as [Id, ComponentObservable<ET, E>];
      });

      return {
        newComponents,
        removedIds: Array.from(removed),
        ids: Array.from(itemMap.keys()),
      };
    })
  );
}

function combineComponents<T extends ElementType, E extends Record<string, any> = never>(
): OperatorFunction<ComponentDiff<T, E>, Component<T, E>[]> {
  return (componentObservableChanges: Observable<ComponentDiff<T, E>>) => {

    const componentMap = new Map<Id, Component<T, E>>();
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
      map((ids: Id[]) => ids.map(id => componentMap.get(id)!)),
    );
  }
}

export function generate<T, ET extends ElementType, E extends Record<string, any> = never>(
  idFunction: (item: T) => Id,
  creationFunction: (item: Observable<T>) => ComponentObservable<ET, E>,
): OperatorFunction<T[], Component<ET, E>[]> {
  return (items$: Observable<T[]>) => items$.pipe(
    itemDiffer(idFunction),
    createComponents(creationFunction),
    combineComponents(),
    startWith([]),
  );
}

// export function generate<T, ET extends ElementType, E extends Record<string, any> = never>(
//   creationFunction: (item: Observable<T>) => ComponentObservable<ET, E>,
//   idFunction: (item: T) => string | number,
// ): OperatorFunction<I[], Component<ET, E>[]> {

//   const res = (items$: Observable<T[]>) => {

//     let previousItemMap = new Map<string | number, T>();
//     const updates = items$.pipe( // Create observable emitting updates to all items.
//       map(items => {
//         const idsAndItems = items.map(item => [idFunction(item), item] as const);
//         const ids = idsAndItems.map(([id]) => id);
//         const itemMap = new Map(idsAndItems);
//         // Create array of ids which have been updated. If id was present in previous ids, add it to updated ids array.
//         const added = ids.filter(id => !previousItemMap.has(id));
//         const updated = new Set(ids.filter(id => previousItemMap.has(id)));
//         const removed = new Set(Array.from(previousItemMap.keys()).filter(id => !itemMap.has(id)))
//         previousItemMap = itemMap; // Keep track of current items.
//         return { itemMap, added, updated, removed };
//       }),
//       shareReplay(SHARE_REPLAY_CONFIG)
//     );

//     const componentMap = new Map<string | number, Component<ET, E>>();
//     const componentUpdates = updates.pipe(
//       map(itemUpdates => {

//         const addedComponents = itemUpdates.added.map(id => {
//           const itemUpdate = updates.pipe(
//             filter(({ updated }) => updated.has(id)),
//             map(({ itemMap }) => itemMap.get(id)!),
//             startWith(itemUpdates.itemMap.get(id)!),
//           );
//           return [id, creationFunction(itemUpdate).pipe(
//             takeUntil(updates.pipe(
//               filter(({ removed }) => removed.has(id)),
//             ))
//           )] as const;
//         });

//         return {
//           addedComponents,
//           removed: itemUpdates.removed,
//           ids: Array.from(itemUpdates.itemMap.keys()),
//         }
//       }),
//       switchMap(({ addedComponents, removed, ids }) => {
//         // addedComponents.forEach(([ id, component ]) => componentMap.set(id, component));
//         removed.forEach(id => componentMap.delete(id));
//         const currentComponents = ids.map(id => componentMap.get(id));

//         return from(addedComponents.map(([id, comp]) => comp.pipe(
//           map(c => [c, id, currentComponents] as const),
//         ))).pipe(
//           mergeAll(),
//           map(([_, components]) => components),
//           distinctUntilChanged(),
//         );
//       })
//     );

//     ////

//   //   const res1 = updates.pipe(
//   //     switchMap((itemUpdates) => {

//   //       const newComponents = itemUpdates.added.map(id => {
//   //         const itemUpdate = updates.pipe(
//   //           filter(({ updated }) => updated.has(id)),
//   //           map(({ itemMap }) => itemMap.get(id)!),
//   //           startWith(itemUpdates.itemMap.get(id)!),
//   //         );
//   //         return creationFunction(itemUpdate).pipe(
//   //           takeUntil(updates.pipe(
//   //             filter(({ removed }) => removed.has(id)),
//   //           ))
//   //         );
//   //       });

//   //       return from(newComponents).pipe(
//   //         map()
//   //       );
//   //     }),
//   //     mergeAll(),
//   //     // map(([_, itemMap]) => itemMap),
//   //     // distinctUntilChanged(),
//   //     // map(itemMap => Array.from(itemMap.values())),
//   //     // startWith([] as T[]),
//   //   );

//   //   let previousElements = new Map<string | number, Component<ET, E> | undefined>();
//   //   return itemsShared.pipe( // Create observable of components
//   //     map(items => {
//   //       const elMap = new Map<string | number, Component<ET, E> | undefined>( // Create a map of current components.
//   //         items.map(item => {
//   //           const id = idFunction(item);
//   //           if (previousElements.has(id)) { // If component already exists, return component.
//   //             return [id, previousElements.get(id)];
//   //           }

//   //           const itemUpdates = updates.pipe( // If not create an observable emitting updates to the relevant item.
//   //             filter(update => update.has(id)),
//   //             map(update => update.get(id)!),
//   //             startWith(item)
//   //           );
//   //           return [id, creationFunction(itemUpdates)]; // Create a new component.
//   //         })
//   //       );

//   //       previousElements = elMap; // Keep track of current elements.
//   //       return elMap;
//   //     }),
//   //     switchMap(elMap => {
//   //       return elMap.size > 0
//   //         ? combineLatest<IComponent<N, E>[]>(...Array.from(elMap.values())) // Combine all components.
//   //         : of([]); // If no components, return empty array.
//   //     }),
//   //     debounceTime(0),
//   //   );
//   // };
// }

// /**
//  * An observable operator to generate an array of RxFM components from an array of type T. The input is an observable
//  * emitting an array of type T and the output is an observable emitting an array of RxFM components.
//  * @param creationFunction A function taking an observable of type T and returning an RxFM component observable.
//  * @param idFunction A function taking a T object and returning a unique id for this object. This is required to prevent
//  * regeneration of components when the array is updated.
//  */
// export function generate<T, N extends Node, E = {}>(
//   creationFunction: (item: Observable<T>) => ComponentOld<N, E>,
//   idFunction: (item: T) => string | number,
// ): OperatorFunction<T[], IComponent<N, E>[]> {

//   return (items$: Observable<T[]>) => {
//     let previousIds = new Map<string | number, T>();
//     const updates = items$.pipe( // Create observable emitting updates to all items.
//       map(items => {
//         const itemIdMap = new Map(items.map(item => [idFunction(item), item]));
//         const updatedIds = Array.from(itemIdMap.keys()).filter(id => // Create array of ids which have been updated.
//           previousIds.has(id) // If id was present in previous ids, add it to updated ids array.
//         );
//         previousIds = itemIdMap; // Keep track of current items.
//         return new Map(updatedIds.map((id) => [id, itemIdMap.get(id)]));
//       }),
//       shareReplay(SHARE_REPLAY_CONFIG)
//     );

//     let previousElements = new Map<string | number, ComponentOld<N, E>>();
//     return items$.pipe( // Create observable of components
//       map(items => {
//         const elMap = new Map<string | number, ComponentOld<N, E>>( // Create a map of current components.
//           items.map(item => {
//             const id = idFunction(item);
//             if (previousElements.has(id)) { // If component already exists, return component.
//               return [id, previousElements.get(id)];
//             }

//             const itemUpdates = updates.pipe( // If not create an observable emitting updates to the relevant item.
//               filter(update => update.has(id)),
//               map(update => update.get(id)),
//               startWith(item)
//             );
//             return [id, creationFunction(itemUpdates).pipe(shareReplay(1))]; // Create a new component.
//           })
//         );

//         previousElements = elMap; // Keep track of current elements.
//         return elMap;
//       }),
//       switchMap(elMap => {
//         return elMap.size > 0
//           ? combineLatest<IComponent<N, E>[]>(...Array.from(elMap.values())) // Combine all components.
//           : of([]); // If no components, return empty array.
//       }),
//       debounceTime(0),
//     );
//   };
// }
