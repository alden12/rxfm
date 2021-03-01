import { Store } from 'rxfm';

// Interfaces:
export interface ITodo {
  label: string;
  done: boolean;
}

export interface IApp {
  todos: ITodo[]
}

// Store subject
export const store = new Store<IApp>({
  todos: [
    { label: 'Write RxFM', done: true },
    { label: 'Buy Bananas', done: true },
    { label: 'Fix All The Bugs', done: false },
  ],
});

// Selectors
export const todosSelector = store.select(({ todos }) => todos);

// Actions
export const addTodoAction = store.action(
  (state, todo: ITodo) => ({ todos: [...state.todos, todo] })
);

export const toggleTodoAction = store.action(
  (state, id: string) => ({
    todos: state.todos.map(todo => todo.label === id ? { label: todo.label, done: !todo.done } : todo),
  })
);

export const deleteTodoAction = store.action(
  (state, id: string) => ({ todos: state.todos.filter(({ label }) => label !== id) })
);
