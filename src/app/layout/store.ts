import { Store } from 'rxfm';
import { IPages } from '../pages';

// Interfaces:
export interface IApp {
  activePage: keyof IPages;
}

// Store:
export const store = new Store<IApp>({
  activePage: 'gettingStarted',
});

// Selectors:
export const activePageSelector = store.select(({ activePage: activeExample }) => activeExample);

// Actions:
export const setActivePageAction = store.action(
  (_, activeExample: keyof IPages) => ({ activePage: activeExample })
);
