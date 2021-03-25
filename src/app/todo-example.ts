import { attributes, classes, div, event, mapToComponents, input, using, destructure } from "rxfm";
import { BehaviorSubject, Observable } from "rxjs"
import { tap } from "rxjs/operators";

interface TodoItem {
  name: string;
  done: boolean;
}

const todoItem = (item: Observable<TodoItem>, onToggle: (name: string) => void) => {

  const { name, done } = destructure(item);

  const toggle = using(name, name => () => onToggle(name));

  const checkbox = input().pipe(
    attributes({ type: 'checkbox', checked: done.pipe(tap(console.log)) }),
  );

  return div(name, checkbox).pipe(
    event('click', toggle),
    classes('todo-item'),
  );
}

const itemInput = (onChange: (value: string) => void) => input().pipe(
  attributes({
    type: 'text',
    placeholder: 'Add Item',
  }),
  event('change', ev => onChange(ev.target.value)),
);

const initialItems: TodoItem[] = [
  { name: 'Buy bananas', done: true },
  { name: 'Finish RxFM', done: false },
  { name: 'Start a new project', done: false },
];

export const todoList = () => {
  const items = new BehaviorSubject<TodoItem[]>(initialItems);

  const addItem = (name: string) => items.next(
    [...items.value, { name, done: false }],
  );

  const toggleItem = (name: string) => items.next(
    items.value.map(item => item.name === name ? { ...item, done: !item.done } : item),
  );

  const todoItems = items.pipe(
    mapToComponents(
      item => todoItem(item, toggleItem),
      ({ name }) => name,
    ),
  );

  return div(
    itemInput(addItem),
    todoItems,
  );
};
