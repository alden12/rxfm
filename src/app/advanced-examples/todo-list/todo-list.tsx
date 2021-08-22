import RxFM, { mapToComponents, conditional, FC } from "rxfm";
import { BehaviorSubject, Observable } from "rxjs";

import './todo-list-styles.css';

const Checkbox: FC<{ checked: Observable<boolean> }> = ({ checked }) => <input type="checkbox" checked={checked} />;

interface TodoItem {
  name: string;
  done: boolean;
}

interface TodoItemProps {
  item: Observable<TodoItem>;
  onToggle: (name: string) => void;
}

const TodoItem: FC<TodoItemProps> = ({ onToggle }, useProps) => {
  const { name, done, toggle } = useProps(({ item }) => ({ ...item, toggle: () => onToggle(item.name) }));

  return <div class={['todo-item', conditional(done, 'done')]} onClick={toggle}>
    {name}
    <Checkbox checked={done} />
  </div>;
};

const ItemInput: FC<{ onChange:(value: string) => void  }> = ({ onChange }) => <input
  type="text"
  placeholder="Add Item"
  onChange={ev => onChange(ev.target.value)}
/>;

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
      item => <TodoItem item={item} onToggle={toggleItem} />
    ),
  );

  return <div>
    <ItemInput onChange={addItem} />
    {TodoItems}
  </div>;
};
