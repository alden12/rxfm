import { Store } from 'rxfm';
import { Pages } from './pages';

// Interfaces:
export interface IApp {
  activePage: keyof Pages;
}

// Store:
export const store = new Store<IApp>({
  activePage: 'intro',
});

// Selectors:
export const activePageSelector = store.select(({ activePage: activeExample }) => activeExample);

// Actions:
export const setActivePageAction = store.action(
  (_, activeExample: keyof Pages) => ({ activePage: activeExample })
);
