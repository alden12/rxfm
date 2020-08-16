import { div, component, setState, show, selectFrom, span } from 'rxfm';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import './expansion.css';

const arrow = (expanded: Observable<boolean>) => span(
  { class: ['arrow', expanded.pipe(map(ex => ex && 'down'))] },
  '>'
);

export const expansion = (title: string, expanded = false) => component(({ children, state }) => div(
  { class: 'expansion' },
  div({
      class: 'title',
      click: setState(state, st => ({ expanded: !st.expanded })),
    },
    arrow(selectFrom(state, 'expanded')),
    title,
  ),
  div({ class: 'content' }, ...children).pipe(
    show(selectFrom(state, 'expanded'))
  ),
), { expanded });

export const expansionContainer = component(({ children }) => div(
  { class: 'expansion-container' },
  ...children,
));
