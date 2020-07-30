import { div, component, dispatch, input, setState, selectFrom } from 'rxfm';
import { examples, exampleArray, Examples } from '../../examples';
import { setActiveExampleAction, activeExampleSelector } from '../store';
import { map, switchMap, distinctUntilChanged } from 'rxjs/operators';

import './sidenav.css';
import { of } from 'rxjs';

const search = input({
  id: 'search',
  autocomplete: 'off',
  placeholder: 'Filter...',
  autofocus: true,
  keyup: setState(event => ({ searchTerm: (event.target as HTMLInputElement).value })),
});

const sidenavItem = (id: keyof Examples) => div({
    class: [
      'sidenav-item',
      activeExampleSelector.pipe(map(activeId => activeId === id && 'selected')),
    ],
    click: dispatch(() => setActiveExampleAction(id)),
  },
  examples[id].title,
);

export const sidenav = component(({ attributes, state }) => div(
  {
    ...attributes,
    id: 'sidenav',
  },
  search,
  ...exampleArray.map(id => selectFrom(state, 'searchTerm').pipe(
    map(term => examples[id].title.toLowerCase().includes(term.toLowerCase())),
    distinctUntilChanged(),
    switchMap(show => show ? sidenavItem(id) : of(null)),
  )),
), { searchTerm: '' });
