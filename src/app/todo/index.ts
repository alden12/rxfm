import { connect } from 'rxfm';
import { todoList } from './todo-list/todo-list';
import { appStore } from './store';

export const app = todoList().pipe(
  connect(appStore),
);
