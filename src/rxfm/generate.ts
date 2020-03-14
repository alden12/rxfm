import { Observable, combineLatest, OperatorFunction, of } from 'rxjs';
import { map, shareReplay, filter, startWith, switchMap, debounceTime, tap } from 'rxjs/operators';
import { SHARE_REPLAY_CONFIG } from './utils';
import { Component, IComponent } from './components';

export function generate<T, N extends Node, E = {}>(
  idFunction: (item: T) => string,
  creationFunction: (item: Observable<T>) => Component<N, E>,
): OperatorFunction<T[], IComponent<N, E>[]> {

  return (items$: Observable<T[]>) => {
    let previousIds = new Map<string, T>();
    const updates = items$.pipe( // Create observable emitting updates to all items.
      map(items => {
        const itemIdMap = new Map(items.map(item => [idFunction(item), item]));
        const updatedIds = Array.from(itemIdMap.keys()).filter(id => // Create array of ids which have been updated.
          previousIds.has(id) // If id was present in previous ids, add it to updated ids array.
        );
        previousIds = itemIdMap; // Keep track of current items.
        return new Map(updatedIds.map((id) => [id, itemIdMap.get(id)]));
      }),
      shareReplay(SHARE_REPLAY_CONFIG)
    );

    let previousElements = new Map<string, Component<N, E>>();
    return items$.pipe( // Create observable of components
      map(items => {
        const elMap = new Map<string, Component<N, E>>( // Create a map of current components.
          items.map(item => {
            const id = idFunction(item);
            if (previousElements.has(id)) { // If component already exists, return component.
              return [id, previousElements.get(id)];
            }

            const itemUpdates = updates.pipe( // If not create an observable emtting updates to the relavent item.
              filter(update => update.has(id)),
              map(update => update.get(id)),
              startWith(item)
            );
            return [id, creationFunction(itemUpdates).pipe(shareReplay(1))]; // Create a new component.
          })
        );

        previousElements = elMap; // Keep track of current elements.
        return elMap;
      }),
      switchMap(elMap => {
        return elMap.size > 0
          ? combineLatest<IComponent<N, E>[]>(...Array.from(elMap.values())) // Combine all components.
          : of([]); // If no componentes return empty array.
      }),
      debounceTime(0),
    );
  };
}
