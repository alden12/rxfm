import RxFM, { conditional } from 'rxfm';
import { of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

const flipFlop = timer(0, 1000).pipe(
  map(i => i % 2 === 0)
);

export const ConditionalComponentsExample = () => <div>
  {flipFlop.pipe(
    switchMap(visible => visible ? <div>Now you see me!</div> : of(null)),
  )}
</div>;

export const ConditionalComponentsSimplifiedExample = () => <div>
  {conditional(flipFlop, <div>Now you see me!</div>)}
</div>;
