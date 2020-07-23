import { todoList } from './todo-list/todo-list';
import { store } from './store';

export const app = store.connect(
  todoList(),
);
