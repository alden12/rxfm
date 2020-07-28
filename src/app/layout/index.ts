import { div, span } from 'rxfm';
import { switchMap } from 'rxjs/operators';
import { activeExampleSelector, store } from './store';
import { examples } from '../examples';
import { sidenav } from './sidenav';

import './layout.css';

const toolbar = div(
  { id: 'toolbar' },
  span({ id: 'branding' }, 'RxFM'),
  span({ id: 'title' }, 'Example App'),
);

export const layout = store.connect(div(
  { id: 'layout' },
  toolbar,
  sidenav({ class: 'sidenav' }),
  div(
    { id: 'content' },
    activeExampleSelector.pipe(
      switchMap(id => examples[id].component)
    ),
  ),
));
