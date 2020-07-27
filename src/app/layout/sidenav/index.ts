import { div, component } from 'rxfm';

import './sidenav.css';

export const sidenav = component(({attributes}) => div(
  {
    id: 'sidenav',
    ...attributes,
  },
  'Left panel',
));
