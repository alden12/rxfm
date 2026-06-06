// The todo-list advanced example, in tsrx. The original leaned on three rxfm
// helpers that tsrx now makes unnecessary, because you write the value form and it
// lifts:
//   destructure(item)            → const { name, done } = item   (D1 destructuring)
//   using(name, n => () => …)    → onClick(() => …name…)         (D2 handler capture)
//   conditional(done, 'done')    → done ? 'done' : ''            (D3 narrowing ternary)
import { Div, Input } from 'rxfm';
import { BehaviorSubject, Observable } from 'rxjs';

import './todo-list-styles.css';

interface TodoItem {
  name: string;
  done: boolean;
}

// `checked` accepts the boolean stream directly; the chainable attribute methods
// take a value or an observable of one.
const Checkbox = (checked: Observable<boolean>) =>
  Input.type('checkbox').checked(checked)();

const TodoItem = (item: Observable<TodoItem>, onToggle: (name: string) => void) => {
  // Destructure the item stream into its fields — each becomes a stream of that
  // field (D1). `done ? 'done' : ''` lifts as a single map (D3), and the click
  // handler captures `name`, so it lifts to a stream of handlers (D2).
  const { name, done } = item;

  return Div
    .onClick(() => onToggle(name))
    .class('todo-item', done ? 'done' : '')(
      name,
      Checkbox(done),
    );
};

const ItemInput = (onChange: (value: string) => void) =>
  Input
    .type('text')
    .placeholder('Add Item')
    .onChange(event => {
      if (event.target instanceof HTMLInputElement) onChange(event.target.value);
    })();

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

  // `items.map(…, 'name')` lifts to mapToComponents keyed by name; the callback's
  // `item` flows into TodoItem as the per-item stream.
  const TodoItems = items.map(item => TodoItem(item, toggleItem), 'name');

  return Div(
    ItemInput(addItem),
    TodoItems,
  );
};

TodoList().subscribe(element => document.body.appendChild(element));
