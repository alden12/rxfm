import { Observable, combineLatest } from 'rxjs';
import { map, shareReplay, filter, startWith, switchMap, debounceTime } from 'rxjs/operators';
import { SHARE_REPLAY_CONFIG } from './utils';
import { Component, IComponent } from './components';

export function generate<T, N extends Node, E = {}>(
  idFunction: (item: T) => string,
  creationFunction: (item: Observable<T>) => Component<N, E>,
): (items: Observable<T[]>) => Observable<IComponent<N, E>[]> {
  return (items$: Observable<T[]>) => {
    let previousIds = new Set<string>();
    const updates = items$.pipe(
      map(items => {
        const itemIds = items.map(item => idFunction(item));
        const idSet = new Set(...itemIds);
        const updatedIds = Array.from(idSet.values()).filter(id =>
          previousIds.has(id)
        );
        previousIds = idSet;
        return new Map(updatedIds.map((id): [string, T] => [id, items[id]]));
      }),
      shareReplay(SHARE_REPLAY_CONFIG)
    );

    let previousElements = new Map<string, Component<N, E>>();
    return items$.pipe(
      map(items => {
        const elMap = new Map<string, Component<N, E>>(
          items.map(item => {
            const id = idFunction(item);
            if (previousElements.has(id)) {
              return [id, previousElements.get(id)];
            }
            const itemUpdates = updates.pipe(
              filter(update => update.has(id)),
              map(update => update.get(id)),
              startWith(item)
            );
            return [id, creationFunction(itemUpdates).pipe(shareReplay(1))];
          })
        );

        previousElements = elMap;
        return elMap;
      }),
      switchMap(elMap => combineLatest<IComponent<N, E>[]>(...Array.from(elMap.values()))),
      debounceTime(0)
    );
  };
}
