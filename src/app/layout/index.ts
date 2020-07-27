import { div, span } from 'rxfm';
import { switchMap } from 'rxjs/operators';
import { activeExampleSelector } from './store';
import { examples } from '../examples';
import { sidenav } from './sidenav';

import './layout.css';

const toolbar = div(
  { id: 'toolbar' },
  span({ id: 'branding' }, 'RxFM'),
  span({ id: 'title' }, 'Example App'),
);

export const layout = div(
  { id: 'layout' },
  toolbar,
  sidenav({ class: 'sidenav' }),
  div(
    { id: 'content' },
    activeExampleSelector.pipe(
      switchMap(id => examples[id])
    ),
  ),
);
