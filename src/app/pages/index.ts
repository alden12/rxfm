import { Component } from 'rxfm';
import { components } from './components';
import { gettingStarted } from './getting-started';
import { attributesPage } from './attributes';
import { operators } from './operators';
import { events } from './events';
import { statePage } from './state';
import { generatePage } from './generate';
import { storePage } from './store';
import { examples } from './examples';
import { customCreatorsPage } from './custom-creators';

export interface IPage {
  title: string;
  component: Component;
};

export interface IPages {
  gettingStarted: IPage;
  components: IPage;
  operators: IPage;
  attributes: IPage;
  children: IPage;
  events: IPage;
  state: IPage;
  generate: IPage;
  store: IPage;
  examples: IPage;
}

export const pages: IPages = {
  gettingStarted: {
    title: 'Getting Started',
    component: gettingStarted,
  },
  components: {
    title: 'Components',
    component: components,
  },
  operators: {
    title: 'Operators',
    component: operators,
  },
  attributes: {
    title: 'Attributes',
    component: attributesPage,
  },
  events: {
    title: 'Events',
    component: events,
  },
  children: {
    title: 'Inputs',
    component: customCreatorsPage,
  },
  state: {
    title: 'State',
    component: statePage,
  },
  generate: {
    title: 'Dynamic Content',
    component: generatePage,
  },
  store: {
    title: 'Store',
    component: storePage,
  },
  examples: {
    title: 'Examples',
    component: examples,
  },
};

export const pageArray: (keyof IPages)[] = [
  'gettingStarted',
  'components',
  'attributes',
  'operators',
  'events',
  'children',
  'state',
  'generate',
  'store',
  'examples',
];
