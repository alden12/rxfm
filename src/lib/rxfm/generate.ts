// import { Observable, combineLatest, OperatorFunction, of } from 'rxjs';
// import { map, shareReplay, filter, startWith, switchMap, debounceTime } from 'rxjs/operators';
// import { SHARE_REPLAY_CONFIG } from './utils';
// import { ComponentOld, IComponent } from './components';



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
