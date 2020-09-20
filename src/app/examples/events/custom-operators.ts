import { button, emitEvent } from 'rxfm';
import { mapTo, scan } from 'rxjs/operators';

export const customEventOperator = button(
  {
    click: event => event.pipe(
      mapTo(1),
      scan((counter, i) => counter + i, 0),
      emitEvent('clickCount', counter => counter)
    ),
  },
  'Click Counter'
);
