import { todoApp } from '../examples/todo';
import { ComponentObservable } from 'rxfm';
import { helloWorld } from './helloWorld';
import { gettingStarted } from './getting-started';

export interface IPage {
  title: string;
  component: ComponentObservable;
};

export interface IPages {
  gettingStarted: IPage;
  helloWorld: IPage;
  todo: IPage;
}

export const pages: IPages = {
  gettingStarted: {
    title: 'Getting Started',
    component: gettingStarted,
  },
  helloWorld: {
    title: 'Hello World',
    component: helloWorld,
  },
  todo: {
    title: 'Todo App',
    component: todoApp,
  },
};

export const pageArray: (keyof IPages)[] = ['gettingStarted', 'helloWorld', 'todo'];
