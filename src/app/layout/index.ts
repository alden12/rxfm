import { div, span, h1, i, dispatch, ternary } from 'rxfm';
import { switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { activePageSelector, setSidenavOpenAction, sidenavOpenSelector } from '../store';
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
  span({ id: 'branding' }, 'RxFM'),
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

export const layout = div(
  { id: 'layout' },
  toolbar,
  sidenav({
    class: ['sidenav', ternary(sidenavOpenSelector, 'open')],
    click: dispatch(() => setSidenavOpenAction(true)),
  }),
  div(
    { id: 'content' },
    h1(activePageSelector.pipe(map(id => pages[id].title))),
    activePageSelector.pipe(
      switchMap(id => pages[id].component)
    ),
    activePageSelector.pipe(
      switchMap(id => navigationArrows(pageArray.indexOf(id)))
    ),
  ).pipe(
    switchMap(component => activePageSelector.pipe(
      map(() => {
        component.element.scrollTo(0, 0);
        return component;
      }),
    )),
    distinctUntilChanged(),
  ),
);
