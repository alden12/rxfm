import { Observable, BehaviorSubject, of } from 'rxjs';
import { Component } from '.';
import { switchAll, shareReplay, tap, map, switchMap } from 'rxjs/operators';
import { Match, match } from './events';

export function stateLoop<T extends Node, M, E extends M, S>(
    creationFunction: (state: Observable<S>, currentState: () => Readonly<S>) => Component<T, E>,
    matchingFunction: (event: E) => Match<M, E>,
    stateFunction: (event: M, currentState: Readonly<S>) => S,
    initialState: S,
): Component<T, Exclude<E, M>> {
    const stateSubject = new BehaviorSubject<Observable<S>>(of(initialState));
    let currentState: S = initialState;
    const state = stateSubject.pipe(
        switchAll(),
        tap(st => currentState = st),
        shareReplay({ bufferSize: 1, refCount: true }),
    )
    const component = creationFunction(state, () => currentState).pipe(
        match(matchingFunction),
    );
    const matchedEvents = component.pipe(
        switchMap(({ matchingEvents }) => matchingEvents),
        map(event => stateFunction(event, currentState)),
    );
    stateSubject.next(matchedEvents);
    return component.pipe(
        map(({ node, events }) => ({ node, events })),
    );
}

export class StateAction<T> {
    constructor(
        public readonly state: Partial<T>,
    ) {}
}

export function stateManager<T extends Node, S, E extends StateAction<S>>(
    creationFunction: (state: Observable<Partial<S>>, currentState: () => Readonly<Partial<S>>) => Component<T, E>,
    initialState: Partial<S> = {},
) {
    return stateLoop<T, StateAction<S>, E, Partial<S>>(
        creationFunction,
        event => event instanceof StateAction ? { match: event } : { noMatch: event },
        (event, currentState) => ({ ...currentState, ...event.state }),
        initialState,
    );
}
