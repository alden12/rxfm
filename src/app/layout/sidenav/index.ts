import { div, component, dispatch } from 'rxfm';

import './sidenav.css';
import { examples, exampleArray } from '../../examples';
import { setActiveExampleAction, activeExampleSelector } from '../store';
import { map } from 'rxjs/operators';

export const sidenav = component(({ attributes }) => div(
  {
    ...attributes,
    id: 'sidenav',
  },
  ...exampleArray.map(id => div({
      class: [
        'sidenav-item',
        activeExampleSelector.pipe(map(activeId => activeId === id && 'selected')),
      ],
      click: dispatch(() => setActiveExampleAction(id)),
    },
    examples[id].title,
  )),
));
