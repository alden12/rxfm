import { div, component, setState, selectFrom, span, ternary, show } from 'rxfm';

import './expansion.css';

export const expansion = (title: string, expanded = false) => component(({ children, state }) => div(
  { class: ['expansion', ternary(selectFrom(state, 'expanded'), 'expanded')] },
  div({
      class: 'title',
      click: setState(state, st => ({ expanded: !st.expanded })),
    },
    span({ class: 'arrow' }, '>'),
    title,
  ),
  div(
    { class: 'content' },
    ...children,
  ).pipe(
    show(selectFrom(state, 'expanded')),
  ),
), { expanded });

export const expansionContainer = component(({ children }) => div(
  { class: 'expansion-container' },
  ...children,
));
