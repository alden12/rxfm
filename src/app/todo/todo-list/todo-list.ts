import { generate, dispatch, setState, div, button, input, component, selectFrom } from 'rxfm';
import { todos$, addTodoAction } from '../store';
import { todoItem } from '../todo-item/todo-item';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import './todo-list.css';

interface ITodoList {
  label: string;
}

const todoListInitialState: ITodoList = {
  label: '',
};

const todoActions = (state: Observable<ITodoList>) => div(
  { class: 'actions' },
  input({
    type: 'text',
    placeholder: 'To Do...',
    value: selectFrom(state, 'label'),
    change: setState(({ target }) => ({ label: (target as HTMLInputElement).value })),
  }),
  button({
      disabled: selectFrom(state, 'label').pipe(map(label => !label)),
      click: dispatch(state, ({ label }) => addTodoAction({ label, done: false })),
    },
    'Add Todo',
  ),
);

export const todoList = component(({ state }) =>  div(
  { class: 'todo-list' },
  todos$.pipe(
    generate(item => item.label, todoItem),
  ),
  todoActions(state),
), todoListInitialState);
