import { todoApp } from '../../examples/todo';
import { ComponentObservable, div } from 'rxfm';
import { introduction } from './introduction';

export interface IPage {
  title: string;
  component: ComponentObservable;
};

export interface IPages {
  intro: IPage;
  todo: IPage;
}

export const pages: IPages = {
  intro: {
    title: 'Introduction',
    component: introduction,
  },
  todo: {
    title: 'Todo App',
    component: todoApp,
  },
};

export type Pages = typeof pages;

export const pageArray: (keyof IPages)[] = ['intro', 'todo'];
