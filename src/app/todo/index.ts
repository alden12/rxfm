import { store, div } from 'rxfm';
import { todoList } from './todo-list/todo-list';
import { storeSubject } from './store';

export const app = div({ id: 'app' }, todoList()).pipe(
  store(storeSubject),
);
