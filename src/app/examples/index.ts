import { todoApp } from './todo';

export const examples = {
  todo: todoApp,
};

export type Examples = typeof examples;

export const exampleArray: (keyof Examples)[] = ['todo'];
