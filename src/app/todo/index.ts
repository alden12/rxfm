import { div } from '../../rxfm/components';
import { children, store } from '../../rxfm';

import { todoList } from './todo-list/todo-list';
import { storeSubject } from './store';

export const app = () => div().pipe(
  children(todoList()),
  store(storeSubject),
);
