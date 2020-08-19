import { div, span, h1 } from 'rxfm';
import { switchMap, map } from 'rxjs/operators';
import { activePageSelector, store } from './store';
import { pages, IPage, pageArray } from '../pages';
import { sidenav } from './sidenav';

import './layout.css';
import { navigationArrow } from './navigation-arrow';

const toolbar = div(
  { id: 'toolbar' },
  span({ id: 'branding' }, 'RxFM'),
  span({ id: 'title' }, 'Example App'),
);

const navigationArrows = (index: number) => {
  const backPage = pageArray[index - 1];
  const forwardPage = pageArray[index + 1];
  return div(
    { class: 'navigation-arrows' },
    div(backPage && navigationArrow(pages[backPage].title, backPage, false)),
    div(forwardPage && navigationArrow(pages[forwardPage].title, forwardPage)),
  );
};

export const layout = store.connect(div(
  { id: 'layout' },
  toolbar,
  sidenav({ class: 'sidenav' }),
  div(
    { id: 'content' },
    h1(activePageSelector.pipe(map(id => pages[id].title))),
    activePageSelector.pipe(
      switchMap(id => pages[id].component)
    ),
    activePageSelector.pipe(
      switchMap(id => navigationArrows(pageArray.indexOf(id)))
    ),
  ),
));
