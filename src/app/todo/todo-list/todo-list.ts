import { div, button, input } from '../../../rxfm/components';
import {
  children,
  generate,
  event,
  dispatch,
  stateful,
  setState,
  select,
  attributes,
  mapToLatest,
} from '../../../rxfm';
import { todos$, addTodoAction } from '../store';
import { todoItem } from '../todo-item/todo-item';
import { Observable } from 'rxjs';

interface ITodoListState {
  label: string,
};

const todoListInitialState: ITodoListState = {
  label: 'insert',
};

const todoListStateless = (state: Observable<ITodoListState>) => div().pipe(
  children(

    todos$.pipe(
      generate(todoItem, item => item.label),
    ),

    input().pipe(
      attributes({
        type: 'text',
        value: state.pipe(select('label')),
      }),
      event(
        'change',
        setState(({ target }) => ({ label: target.value })),
      ),
    ),

    button().pipe(
      event(
        'click',
        mapToLatest(state),
        dispatch(({ label }) => addTodoAction({ label, done: false }))
      ),
      children('Add Todo'),
    ),

  ),
);

export const todoList = () => stateful(todoListInitialState, todoListStateless);
