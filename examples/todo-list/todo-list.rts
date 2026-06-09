import { Div, Input } from 'rxfm';
import { BehaviorSubject, Observable } from 'rxjs';

import './todo-list-styles.css';

interface TodoItem {
  name: string;
  done: boolean;
}

const Checkbox = (checked: Observable<boolean>) =>
  Input
    .type('checkbox')
    .checked(checked)
    ``;

const TodoItem = (item: Observable<TodoItem>, onToggle: (name: string) => void) => {
  const { name, done } = item;

  return Div
    .onClick(() => onToggle(name))
    .class('todo-item', done ? 'done' : '')
    `${name} ${Checkbox(done)}`;
};

const ItemInput = (onChange: (value: string) => void) =>
  Input
    .type('text')
    .placeholder('Add Item')
    .onChange(event => {
      if (event.target instanceof HTMLInputElement) onChange(event.target.value);
    })
    ``;

const initialItems: TodoItem[] = [
  { name: 'Buy bananas', done: true },
  { name: 'Finish RxFM', done: false },
  { name: 'Start a new project', done: false },
];

export const TodoList = () => {
  const items = new BehaviorSubject<TodoItem[]>(initialItems);

  const addItem = (name: string) => items.next([...items.value, { name, done: false }]);

  const toggleItem = (name: string) => items.next(
    items.value.map(item => item.name === name ? { ...item, done: !item.done } : item),
  );

  const TodoItems = items.map(item => TodoItem(item, toggleItem), 'name');

  return Div`
    ${ItemInput(addItem)}
    ${TodoItems}
  `;
};
