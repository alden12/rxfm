
export type Reducer<S> = (state: S) => S;

export type Action<K extends string, S> = Record<K, Reducer<S>>;



// export function state<T extends Node, S, K extends string, E extends Actions<K, S>>(
//   eventType: K,
//   stateSubject: BehaviorSubject<S>,
// ): ComponentOperator<T, E, { [EK in Exclude<keyof E, K>]?: E[EK] }> {
//   return (component: Component<T, E>) => component.pipe(
//     extractEvent(eventType),
//     switchMap(({ node, events, extractedEvents }) => extractedEvents.pipe(
//       tap((action: Action<S>) => stateSubject.next(action(stateSubject.value))),
//       startWith({ node, events }),
//       mapTo({ node, events }),
//     )),
//     distinctUntilKeysChanged(),
//     shareReplay(SHARE_REPLAY_CONFIG),
//   );
// }
