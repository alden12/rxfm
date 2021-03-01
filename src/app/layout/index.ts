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

const branding = div(
  { class: 'branding' },
  i({ class: ['material-icons', 'logo'] }, 'double_arrow'),
  span({ class: 'name' }, 'RxFM'),
);

const toolbar = div(
  { id: 'toolbar' },
  menuButton,
  span({ id: 'toolbar-branding',
    click: dispatch(() => setActivePageAction('gettingStarted')) },
    branding,
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
    div({ class: 'arrow-container' }, backPage && navigationArrow(pages[backPage].title, backPage, false)),
    div({ class: 'arrow-container' }, forwardPage && navigationArrow(pages[forwardPage].title, forwardPage)),
  );
}

const footer = div(
  { id: 'footer' },
  'Please visit the ',
  a({ href: 'https://github.com/alden12/rxfm' }, 'RxFM GitHub Page'),
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
      id === pageArray[0] && div({ id: 'homepage-branding' }, branding),
      h1(pages[id].title),
      pages[id].component,
      navigationArrows(pageArray.indexOf(id)),
      footer,
    )),
  ),
);
