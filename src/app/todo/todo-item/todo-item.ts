import { div, input, button } from '../../../rxfm/components';
import { children, select, event, dispatch, classes, styles, attributes, mapToLatest, conditionalMapTo } from '../../../rxfm';
import { Observable } from 'rxjs';
import { ITodo, toggleTodoAction, deleteTodoAction } from '../store';
import { withLatestFrom } from 'rxjs/operators';

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
      children('Delete'),
      event(
        'click',
        withLatestFrom(item),
        dispatch(([ev, { label }]) => { ev.stopPropagation(); return deleteTodoAction(label); }),
      )
    ),

  ),
);
