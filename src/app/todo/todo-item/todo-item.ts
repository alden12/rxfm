import { div, input, button } from '../../../rxfm/components';
import { children, select, event, dispatch, attribute, classes, styles } from '../../../rxfm';
import { Observable } from 'rxjs';
import { ITodo, toggleTodoAction, deleteTodoAction } from '../store';

import './todo-item.css';
import { map } from 'rxjs/operators';

export const todoItem = (item: Observable<ITodo>) => div().pipe(
  classes(item.pipe(
    map(({ done }) => done ? ['todo-item', 'done'] : ['todo-item']), // TODO: convert to use spread to prevent duplicate
  )),
  event('click',
    dispatch(item, ({ state: { label } }) => toggleTodoAction(label))
  ),
  children(
    input().pipe(
      attribute('type', 'checkbox'),
      attribute('checked', item.pipe(select('done'))),
      styles({ cursor: 'pointer' }),
    ),
    item.pipe(select('label')),
    button().pipe(
      styles({ marginLeft: '10px' }),
      children('Delete'),
      event('click',
        dispatch(item, ({ ev, state: { label } }) => {
          ev.stopPropagation();
          return deleteTodoAction(label)
        }),
      )
    ),
  ),
);
