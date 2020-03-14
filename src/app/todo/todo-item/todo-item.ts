import { div, button, input } from '../../../rxfm/components';
import { children, select, event, dispatch, attribute } from '../../../rxfm';
import { Observable } from 'rxjs';
import { ITodo, toggleTodoAction } from '../store';

export const todoItem = (item: Observable<ITodo>) => div().pipe(
  children(
    input().pipe(
      attribute('type', 'checkbox'),
      attribute('checked', item.pipe(select('done'))),
      event('click',
        dispatch(item, ({ state: { label } }) => toggleTodoAction(label))
      ),
    ),
    item.pipe(select('label')),
  ),
);
