import { BehaviorSubject } from 'rxjs';
import { Action, select, REF_COUNT } from 'rxfm';
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
    { label: 'Write RxFM', done: true },
    { label: 'Buy Bananas', done: true },
    { label: 'Fix All The Bugs', done: false },
  ],
});

// TODO: Create selector function taking either mapping function or keys with share built in.
// Selectors
export const todos$ = storeSubject.pipe(
  select('todos'),
  shareReplay(REF_COUNT),
);

// Actions
export const addTodoAction: Action<ITodo, IApp> = (todo: ITodo) => ({ todos }) => ({ todos: [...todos, todo] });

export const toggleTodoAction: Action<string, IApp> = (id: string) => ({ todos }) => ({
  todos: todos.map(todo => todo.label === id ? { label: todo.label, done: !todo.done } : todo),
});

export const deleteTodoAction: Action<string, IApp> = (id: string) => ({ todos }) => ({
  todos: todos.filter(({ label }) => label !== id),
});
