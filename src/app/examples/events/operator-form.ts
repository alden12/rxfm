import { button, event } from 'rxfm';
import { tap } from 'rxjs/operators';

export const eventOperatorForm = button('Click Me').pipe(
  event('click', tap(() => window.alert('You clicked the button!')))
);
