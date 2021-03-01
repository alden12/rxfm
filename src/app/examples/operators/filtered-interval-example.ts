import { interval } from 'rxjs';
import { div } from 'rxfm';
import { filter } from 'rxjs/operators';

const filteredIntervalObservable = interval(1000).pipe(
  filter(i => i % 2 === 0),
);

export const filteredIntervalExample = div('Even numbers: ', filteredIntervalObservable);
