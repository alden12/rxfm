import { div, component, dispatch, input, setState, selectFrom, generate, span, show } from 'rxfm';
import { pages, pageArray, IPages } from '../../pages';
import { setActivePageAction, activePageSelector } from '../store';
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
  span({
      class: 'clear',
      title: 'Clear',
      click: setState(() => ({ searchTerm: '' })),
    },
    '×',
  ).pipe(
    show(value),
  ),
);

const sidenavItem = (id: keyof IPages) => div({
    class: [
      'sidenav-item',
      activePageSelector.pipe(map(activeId => activeId === id && 'selected')),
    ],
    click: dispatch(() => setActivePageAction(id)),
  },
  pages[id].title,
);

const searchFunction = (term: string, value: string) => value.toLowerCase().includes(term.toLowerCase());

export const sidenav = component(({ attributes, state }) => div({
    ...attributes,
    id: 'sidenav',
  },
  search(selectFrom(state, 'searchTerm')),
  selectFrom(state, 'searchTerm').pipe(
    map(term => pageArray.filter(id => searchFunction(term, pages[id].title))),
    generate(sidenavItem),
  ),
), { searchTerm: '' });
