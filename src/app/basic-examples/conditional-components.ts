import { conditional, Div } from 'rxfm';
import { of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

const flipFlop = timer(0, 1000).pipe(
  map(i => i % 2 === 0)
);

export const ConditionalComponentsExample = Div(
  flipFlop.pipe(
    switchMap(visible => visible ? Div('Now you see me!') : of(null)),
  ),
);

export const ConditionalComponentsSimplifiedExample = Div(
  conditional(flipFlop, Div('Now you see me!'))
);
