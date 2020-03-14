import { BehaviorSubject } from 'rxjs';
import { Action, select } from '../../rxfm';

// Interfaces:
export interface ITodo {
  label: string;
  done: boolean;
}

export interface IApp {
  todos: ITodo[]
}

// Store subject
export const storeSubject = new BehaviorSubject<IApp>({
  todos: [
    { label: 'test', done: false },
    { label: 'test1', done: true },
  ],
});

// Selectors
export const todos$ = storeSubject.pipe(
  select('todos'),
);

// Actions
export const addTodoAction: Action<ITodo, IApp> = (todo: ITodo) => ({ todos }: IApp) => ({ todos: [...todos, todo] });
