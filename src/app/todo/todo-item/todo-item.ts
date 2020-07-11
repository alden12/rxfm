import { dispatch, conditionalMapTo, stopPropagation, div, input, button, selectFrom } from 'rxfm';
import { Observable } from 'rxjs';
import { ITodo, toggleTodoAction, deleteTodoAction } from '../store';

import './todo-item.css';

export const todoItem = (item: Observable<ITodo>) => div({
    class: selectFrom(item, 'done').pipe(conditionalMapTo('done')),
    click: dispatch(item, ({ label }) => toggleTodoAction(label)),
  },
  input({
    type: 'checkbox',
    checked: selectFrom(item, 'done'),
    style: { cursor: 'pointer' },
  }),
  selectFrom(item, 'label'),
  button({
      style: { marginLeft: '10px' },
      click: ev => ev.pipe(
        stopPropagation(),
        dispatch(item, ({ label }) => deleteTodoAction(label)),
      ),
    },
    'Delete',
  ),
);
