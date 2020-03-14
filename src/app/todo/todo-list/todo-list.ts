import { div, button } from '../../../rxfm/components';
import { children, generate, event, dispatch } from '../../../rxfm';
import { todos$, addTodoAction } from '../store';
import { todoItem } from '../todo-item/todo-item';

export const todoList = () => div().pipe(
  children(
    todos$.pipe(
      generate(
        item => item.label,
        item$ => todoItem(item$),
      ),
    ),
    button().pipe(
      children('Add Todo'),
      event('click',
        dispatch(() => addTodoAction({ label: Date.now().toString(), done: false }))
      )
    ),
  ),
);
