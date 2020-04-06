import {
  children,
  select,
  event,
  dispatch,
  classes,
  styles,
  attributes,
  mapToLatest,
  conditionalMapTo,
  stopPropagation,
  div,
  input,
  button,
} from '../../../rxfm';
import { Observable } from 'rxjs';
import { ITodo, toggleTodoAction, deleteTodoAction } from '../store';

import './todo-item.css';

export const todoItem = (item: Observable<ITodo>) => div().pipe(
  classes(
    'todo-item',
    item.pipe(
      select('done'),
      conditionalMapTo('done'),
    )
  ),
  event(
    'click',
    mapToLatest(item),
    dispatch(({ label }) => toggleTodoAction(label))
  ),
  children(

    input().pipe(
      attributes({
        type: 'checkbox',
        checked: item.pipe(select('done')),
      }),
      styles({ cursor: 'pointer' }),
    ),

    item.pipe(select('label')),

    button().pipe(
      styles({ marginLeft: '10px' }),
      event(
        'click',
        stopPropagation(),
        mapToLatest(item),
        dispatch(({ label }) => deleteTodoAction(label)),
      ),
      children('Delete'),
    ),

  ),
);
