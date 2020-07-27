import { todoList } from './todo-list/todo-list';
import { store } from './store';

export const todoApp = store.connect(
  todoList(),
);
