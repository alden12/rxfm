import { todoApp } from '../examples/todo';
import { Component } from 'rxfm';
import { components } from './components';
import { gettingStarted } from './getting-started';
import { attributesPage } from './attributes';

export interface IPage {
  title: string;
  component: Component;
};

export interface IPages {
  gettingStarted: IPage;
  components: IPage;
  attributes: IPage;
  todo: IPage;
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
  attributes: {
    title: 'Attributes',
    component: attributesPage,
  },
  todo: {
    title: 'Todo App',
    component: todoApp,
  },
};

export const pageArray: (keyof IPages)[] = ['gettingStarted', 'components', 'attributes', 'todo'];
