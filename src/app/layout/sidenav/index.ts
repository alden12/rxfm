import { div, component, dispatch, input, setState, selectFrom, generate, span, show } from 'rxfm';
import { examples, exampleArray, Examples } from '../../examples';
import { setActiveExampleAction, activeExampleSelector } from '../store';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import './sidenav.css';

const search = (value: Observable<string>) => div(
  { class: 'search' },
  input({
    id: 'search-input',
    autocomplete: 'off',
    placeholder: 'Filter...',
    autofocus: true,
    value,
    keyup: setState(event => ({ searchTerm: (event.target as HTMLInputElement).value })),
  }),
  value,
  span({
      class: 'clear',
      click: setState(() => ({ searchTerm: '' })),
    },
    '×',
  ).pipe(
    show(value),
  ),
);

const sidenavItem = (id: keyof Examples) => div({
    class: [
      'sidenav-item',
      activeExampleSelector.pipe(map(activeId => activeId === id && 'selected')),
    ],
    click: dispatch(() => setActiveExampleAction(id)),
  },
  examples[id].title,
);

const searchFunction = (term: string, value: string) => value.toLowerCase().includes(term.toLowerCase());

export const sidenav = component(({ attributes, state }) => div({
    ...attributes,
    id: 'sidenav',
  },
  search(selectFrom(state, 'searchTerm')),
  selectFrom(state, 'searchTerm').pipe(
    map(term => exampleArray.filter(id => searchFunction(term, examples[id].title))),
    generate(sidenavItem),
  ),
), { searchTerm: '' });
