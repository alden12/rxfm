import { dispatch, conditionalMapTo, stopPropagation, div, input, button, selectFrom, span } from 'rxfm';
import { Observable, of } from 'rxjs';
import { ITodo, toggleTodoAction, deleteTodoAction } from '../store';

import './todo-item.css';
import { mapTo, tap, startWith, map, distinctUntilChanged } from 'rxjs/operators';

// const test = span({});

export const todoItem = (item: Observable<ITodo>) => div(
  {
    // class: of({ done: true }).pipe(
    //   map(({ done }) => done ? 'done' : null),
    // ),
    class: selectFrom(item, 'done').pipe(conditionalMapTo('done')),
    // class: of('done'),
    click: dispatch(item, ({ label }) => toggleTodoAction(label)),
  },
  input({
    type: 'checkbox',
    checked: selectFrom(item, 'done'),
    style: { cursor: 'pointer' },
  }),
  // span({}),
  // input({}),
  selectFrom(item, 'label'),
  button(
    {
      style: { marginLeft: '10px' },
      click: ev => ev.pipe(
        stopPropagation(),
        dispatch(item, ({ label }) => deleteTodoAction(label)),
      ),
    },
    'Delete',
  ),
);
