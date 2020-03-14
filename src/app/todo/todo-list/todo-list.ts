import { div, button, input } from '../../../rxfm/components';
import { children, generate, event, dispatch, stateful, setState, attribute, select } from '../../../rxfm';
import { todos$, addTodoAction } from '../store';
import { todoItem } from '../todo-item/todo-item';
import { Observable } from 'rxjs';

interface ITodoListState {
  label: string,
};

const todoListInitialState: ITodoListState = {
  label: 'insert',
};

const todoListComponent = (state: Observable<ITodoListState>) => div().pipe(
  children(
    todos$.pipe(
      generate(
        item => item.label,
        item$ => todoItem(item$),
      ),
    ),
    input().pipe(
      attribute('type', 'text'),
      attribute('value', state.pipe(select('label'))),
      event('keypress',
        setState(({ srcElement }) => ({ label: (srcElement as HTMLInputElement).value }))
      ),
    ),
    button().pipe(
      children('Add Todo'),
      event('click',
        dispatch(state, ({ state: { label } }) => addTodoAction({ label, done: false }))
      ),
      event('click', setState(() => ({ newLabel: '' })))
    ),
  ),
);

export const todoList = () => stateful(todoListInitialState, todoListComponent);
