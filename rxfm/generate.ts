
export function generate<T, N extends Node>(
  idFunction: (item: T) => string,
  creationFunction: (item: Observable<T>) => Observable<N>
): (items: Observable<T[]>) => Observable<N[]> {
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
      shareReplay(1)
    );

    let previousElements = new Map<string, Observable<N>>();
    return items$.pipe(
      map(items => {
        const elMap = new Map(
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
      switchMap(elMap => combineLatest<N[]>(...Array.from(elMap.values()))),
      debounceTime(0)
    );
  };
}
