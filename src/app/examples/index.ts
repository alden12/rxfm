import { todoApp } from './todo';
import { ComponentObservable, div } from 'rxfm';

export interface IExample {
  id: string;
  title: string;
  component: ComponentObservable;
};

export interface IExamples {
  intro: IExample;
  helloWorld: IExample;
  todo: IExample;
}

export const examples: IExamples = {
  intro: {
    id: 'intro',
    title: 'Introduction',
    component: div('Welcome to RxFM'), // TODO: Replace
  },
  helloWorld: {
    id: 'helloWorld',
    title: 'Hello World',
    component: div('hello world'), // TODO: Replace
  },
  todo: {
    id: 'todo',
    title: 'Todo App',
    component: todoApp,
  },
};

export type Examples = typeof examples;

export const exampleArray: (keyof IExamples)[] = ['intro', 'helloWorld', 'todo'];
