import { div, component } from 'rxfm';

import './sidenav.css';

export const sidenav = component(({ attributes }) => div(
  {
    ...attributes,
    id: 'sidenav',
  },
  'Left panel',
));
