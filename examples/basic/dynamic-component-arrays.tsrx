// Dynamic component arrays. `items.map(cb, 'name')` lifts to `mapToComponents`
// (keyed by name for reconciliation). The callback destructures the item stream in
// place — `({ name, done }) => …` — so `name` and `done ? '' : 'not'` read as plain
// values inside the template (D4); no separate `Item` helper or `destructure` needed.
import { Div } from 'rxfm';
import { BehaviorSubject } from 'rxjs';

interface TodoItem {
  name: string;
  done: boolean;
}

export const ComponentArraysExample = () => {
  const items = new BehaviorSubject<TodoItem[]>([
    { name: 'Item 1', done: true },
    { name: 'Item 2', done: false },
    { name: 'Item 3', done: true },
  ]);

  const ItemComponents = items.map(
    ({ name, done }) => Div`${name} is ${done ? '' : 'not'} done!`,
    'name',
  );

  return Div(ItemComponents);
};
