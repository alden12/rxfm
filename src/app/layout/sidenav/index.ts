import { div, component, dispatch, input, setState, selectFrom, generate } from 'rxfm';
import { examples, exampleArray, Examples } from '../../examples';
import { setActiveExampleAction, activeExampleSelector } from '../store';
import { map } from 'rxjs/operators';

import './sidenav.css';

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

const searchFunction = (term: string, value: string) => value.toLowerCase().includes(term.toLowerCase());

export const sidenav = component(({ attributes, state }) => div(
  {
    ...attributes,
    id: 'sidenav',
  },
  search,
  selectFrom(state, 'searchTerm').pipe(
    map(term => exampleArray.filter(id => searchFunction(term, examples[id].title))),
    generate(sidenavItem),
  ),
), { searchTerm: '' });
