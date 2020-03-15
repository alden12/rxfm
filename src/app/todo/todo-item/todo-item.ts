import { div, input, button } from '../../../rxfm/components';
import { children, select, event, dispatch, classes, styles, attributes, mapToLatest } from '../../../rxfm';
import { Observable } from 'rxjs';
import { ITodo, toggleTodoAction, deleteTodoAction } from '../store';

import './todo-item.css';
import { map, withLatestFrom } from 'rxjs/operators';

export const todoItem = (item: Observable<ITodo>) => div().pipe(
  classes(
    'todo-item',
    item.pipe(map(({ done }) => done ? 'done' : ''))
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
