import { generate, dispatch, setState, div, button, input, component, selectFrom, span } from 'rxfm';
import { todos$, addTodoAction } from '../store';
import { todoItem } from '../todo-item/todo-item';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import './todo-list.css';

interface ITodoList {
  label: string;
  showDone: boolean;
}

const todoListInitialState: ITodoList = {
  label: '',
  showDone: true,
};

const todoHeader = (state: Observable<ITodoList>) => div(
  { class: 'header' },
  span({
      class: 'show-done',
      click: setState(state, ({ showDone }) => ({ showDone: !showDone })),
    },
    input({
      type: 'checkbox',
      checked: selectFrom(state, 'showDone'),
    }),
    'Show Done'
  ),
)

const todoActions = (state: Observable<ITodoList>) => div(
  { class: 'actions' },
  input({
    type: 'text',
    placeholder: 'To Do...',
    value: selectFrom(state, 'label'),
    keyup: setState(({ target }) => ({ label: (target as HTMLInputElement).value })),
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
  todoHeader(state),
  selectFrom(state, 'showDone').pipe(
    switchMap(showDone => showDone ? todos$ : todos$.pipe(
      map(todos => todos.filter(({ done }) => done))
    )),
    generate(item => item.label, todoItem),
  ),
  todoActions(state),
), todoListInitialState);
