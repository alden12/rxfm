import { div, span, h1, i, dispatch, ternary, a } from 'rxfm';
import { switchMap, map } from 'rxjs/operators';
import { activePageSelector, setSidenavOpenAction, sidenavOpenSelector, setActivePageAction } from '../store';
import { pages, pageArray } from '../pages';
import { sidenav } from './sidenav';
import { navigationArrow } from './navigation-arrow';

import './layout.css';

const menuButton = i({
    id: 'menu-button',
    class: ['material-icons'],
    click: dispatch(() => setSidenavOpenAction(undefined))
  },
  'menu'
);

const toolbar = div(
  { id: 'toolbar' },
  menuButton,
  span({ id: 'branding',
    click: dispatch(() => setActivePageAction('gettingStarted')) },
    'RxFM',
  ),
  span({ id: 'title' }, activePageSelector.pipe(
    map(id => pages[id].title),
  )),
);

const navigationArrows = (index: number) => {
  const backPage = pageArray[index - 1];
  const forwardPage = pageArray[index + 1];
  return div(
    { class: 'navigation-arrows' },
    div(backPage && navigationArrow(pages[backPage].title, backPage, false)),
    div(forwardPage && navigationArrow(pages[forwardPage].title, forwardPage)),
  );
}

const footer = div(
  { id: 'footer' },
  'Please visit the ',
  a({ href: 'https://github.com/alden12/rxfm' }, 'RxFM Github Page'),
  ' for license information'
)

export const layout = div(
  { id: 'layout' },
  toolbar,
  sidenav({
    class: ['sidenav', ternary(sidenavOpenSelector, 'open')],
    click: dispatch(() => setSidenavOpenAction(true)),
  }),
  div({
    class: ['sidenav-overlay', ternary(sidenavOpenSelector, 'open')],
    click: dispatch(() => setSidenavOpenAction(true)),
  }),
  activePageSelector.pipe(
    switchMap(id => div(
      { id: 'content' },
      h1(pages[id].title),
      pages[id].component,
      navigationArrows(pageArray.indexOf(id)),
      footer,
    )),
  ),
);
