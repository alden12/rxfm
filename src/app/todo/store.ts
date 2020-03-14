import { BehaviorSubject } from 'rxjs';
import { Action, select, SHARE_REPLAY_CONFIG } from '../../rxfm';
import { shareReplay } from 'rxjs/operators';

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
  shareReplay(SHARE_REPLAY_CONFIG),
);

// Actions
export const addTodoAction: Action<ITodo, IApp> = (todo: ITodo) => ({ todos }: IApp) => ({ todos: [...todos, todo] });

export const toggleTodoAction: Action<string, IApp> = (id: string) => ({ todos }: IApp) => ({
  todos: todos.map(todo => todo.label === id ? { label: todo.label, done: !todo.done } : todo),
});

export const deleteTodoAction: Action<string, IApp> = (id: string) => ({ todos }: IApp) => ({
  todos: todos.filter(({ label }) => label !== id),
});
