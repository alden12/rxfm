import { Store } from 'rxfm';
import { Examples } from '../examples';

// Interfaces:
export interface IApp {
  activeExample: keyof Examples;
}

// Store:
export const store = new Store<IApp>({
  activeExample: 'todo',
});

// Selectors:
export const activeExampleSelector = store.select(({ activeExample }) => activeExample);

// Actions:
export const setActiveExampleAction = store.action(
  (_, activeExample: keyof Examples) => ({ activeExample })
);
