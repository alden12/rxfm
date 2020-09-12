import { button } from 'rxfm';
import { tap } from 'rxjs/operators';

export const clickExample = button(
  { click: tap(() => window.alert('You clicked the button!')) },
  'Click Me',
);
