import { interval } from 'rxjs';
import { div } from 'rxfm';
import { map } from 'rxjs/operators';

const mappedIntervalObservable = interval(1000).pipe(
  map(i => i % 2 === 0 ? 'Even' : 'Odd'),
);

export const mappedIntervalExample = div('The number is: ', mappedIntervalObservable);
