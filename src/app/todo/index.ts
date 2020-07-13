import { store } from 'rxfm';
import { todoList } from './todo-list/todo-list';
import { storeSubject } from './store';

export const app = todoList().pipe(
  store(storeSubject),
);
