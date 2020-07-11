import { generate, dispatch, setState, div, button, input, component, selectFrom } from 'rxfm';
import { todos$, addTodoAction } from '../store';
import { todoItem } from '../todo-item/todo-item';

const todoListInitialState = {
  label: 'insert',
};

export const todoList = component(({ state }) =>  div(
  todos$.pipe(
    generate(item => item.label, todoItem),
  ),
  input({
    type: 'text',
    value: selectFrom(state, 'label'),
    change: setState(({ target }) => ({ label: (target as HTMLInputElement).value })),
  }),
  button({
      click: dispatch(state, ({ label }) => addTodoAction({ label, done: false })),
    },
    'Add Todo',
  ),
), todoListInitialState);
