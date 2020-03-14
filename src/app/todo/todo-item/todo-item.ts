import { div, button } from '../../../rxfm/components';
import { children, select, event, dispatch } from '../../../rxfm';
import { Observable } from 'rxjs';
import { ITodo, completeTodoAction } from '../store';
import { withLatestFrom } from 'rxjs/operators';

export const todoItem = (item: Observable<ITodo>) => div().pipe(
  children(
    item.pipe(select('label')),
    ' ',
    item.pipe(select('done')),
    button().pipe(
      children('Complete'),
      event('click',
        ev => ev.pipe(
          withLatestFrom(item),
          dispatch(item, ({ state: { label } }) => completeTodoAction(label))
        )
      ),
    ),
  ),
);
