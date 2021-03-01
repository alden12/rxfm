import { interval } from 'rxjs';
import { div } from 'rxfm';

const timePeriod = 1000; // The time period in milliseconds.

const intervalObservable = interval(timePeriod);

export const intervalExample = div('The observable emitted: ', intervalObservable);
