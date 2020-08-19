import { div, span, dispatch } from 'rxfm';
import { IPages } from '../../pages';
import { setActivePageAction } from '../store';

import './navigation-arrow.css';

export const navigationArrow = (title: string, link: keyof IPages, forward = true) => div({
    class: 'navigation-arrow',
    click: dispatch(() => setActivePageAction(link)),
  },
  div({ class: 'arrow' }, forward ? '›' : '‹'),
  span(title),
);
