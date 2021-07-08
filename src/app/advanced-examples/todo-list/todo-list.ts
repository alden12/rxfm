import { attributes, classes, Div, event, mapToComponents, Input, using, destructure, conditional } from "rxfm";
import { BehaviorSubject, Observable } from "rxjs";

import './todo-list-styles.css';

interface TodoItem {
  name: string;
  done: boolean;
}

const Checkbox = (checked: Observable<boolean>) => Input().pipe(
  attributes({ type: 'checkbox', checked }),
);

const TodoItem = (item: Observable<TodoItem>, onToggle: (name: string) => void) => {
  const { name, done } = destructure(item);
  const toggle = using(name, name => () => onToggle(name));

  return Div(name, Checkbox(done)).pipe(
    event.click(toggle),
    classes`todo-item ${conditional(done, 'done')}`,
  );
};

const ItemInput = (onChange: (value: string) => void) => Input().pipe(
  attributes({
    type: 'text',
    placeholder: 'Add Item',
  }),
  event.change(ev => onChange(ev.target.value)),
);

const initialItems: TodoItem[] = [
  { name: 'Buy bananas', done: true },
  { name: 'Finish RxFM', done: false },
  { name: 'Start a new project', done: false },
];

export const TodoList = () => {
  const items = new BehaviorSubject<TodoItem[]>(initialItems);

  const addItem = (name: string) => items.next(
    [...items.value, { name, done: false }],
  );

  const toggleItem = (name: string) => items.next(
    items.value.map(item => item.name === name ? { ...item, done: !item.done } : item),
  );

  const TodoItems = items.pipe(
    mapToComponents(
      ({ name }) => name,
      item => TodoItem(item, toggleItem),
    ),
  );

  return Div(
    ItemInput(addItem),
    TodoItems,
  );
};
