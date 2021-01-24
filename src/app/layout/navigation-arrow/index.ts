import { div, span, dispatch, i } from 'rxfm';
import { IPages } from '../../pages';
import { setActivePageAction } from '../../store';

import './navigation-arrow.css';

export const navigationArrow = (title: string, link: keyof IPages, forward = true) => div({
    class: 'navigation-arrow',
    click: dispatch(() => setActivePageAction(link)),
  },
  i({ class: ['material-icons', 'arrow'] }, forward ? 'navigate_next' : 'navigate_before'),
  span({ class: 'title' }, title),
);
