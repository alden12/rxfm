import { todoApp } from '../examples/todo';
import { Component } from 'rxfm';
import { helloWorld } from './hello-world';
import { gettingStarted } from './getting-started';

export interface IPage {
  title: string;
  component: Component;
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
