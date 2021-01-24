import { div } from 'rxfm';
import { interval } from 'rxjs';

export const counter = div(
  'You have been reading about components for ',
  interval(1000),
  ' seconds so far!'
);
