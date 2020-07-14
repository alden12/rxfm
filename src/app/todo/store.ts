import { store, selector, action } from 'rxfm';

// Interfaces:
export interface ITodo {
  label: string;
  done: boolean;
}

export interface IApp {
  todos: ITodo[]
}

// Store subject
export const appStore = store<IApp>({
  todos: [
    { label: 'Write RxFM', done: true },
    { label: 'Buy Bananas', done: true },
    { label: 'Fix All The Bugs', done: false },
  ],
});

// Selectors
export const todosSelector = selector(appStore, ({ todos }) => todos);

// Actions
export const addTodoAction = action(
  (state: IApp, todo: ITodo) => ({ todos: [...state.todos, todo] })
);

export const toggleTodoAction = action(
  (state: IApp, id: string) => ({
    todos: state.todos.map(todo => todo.label === id ? { label: todo.label, done: !todo.done } : todo),
  })
);

export const deleteTodoAction = action(
  (state: IApp, id: string) => ({
    todos: state.todos.filter(({ label }) => label !== id),
  })
);
