import { Store } from 'rxfm';
import { IPages } from './pages';

// Interfaces:
export interface IApp {
  activePage: keyof IPages;
  sidenavOpen: boolean;
}

// Store:
export const store = new Store<IApp>({
  activePage: 'gettingStarted',
  sidenavOpen: true,
});

// Selectors:
export const activePageSelector = store.select(({ activePage }) => activePage);
export const sidenavOpenSelector = store.select(({ sidenavOpen }) => sidenavOpen);

// Actions:
export const setActivePageAction = store.action((_, activePage: keyof IPages) => ({ activePage }));

export const setSidenavOpenAction = store.action(
  (state, open?: boolean) => ({ sidenavOpen: open !== undefined ? open : !state.sidenavOpen }),
);
