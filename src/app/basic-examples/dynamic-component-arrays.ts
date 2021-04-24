import { Div, mapToComponents } from 'rxfm';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface TodoItem {
  name: string;
  done: boolean;
}

export const ComponentArraysExample = () => {
  const items = new BehaviorSubject<TodoItem[]>([
    { name: 'Item 1', done: true, },
    { name: 'Item 2', done: false, },
    { name: 'Item 3', done: true, },
  ]);

  const Item = (item: Observable<TodoItem>) => Div(
    item.pipe(
      map(({ name, done }) => `${name} is ${done ? '' : 'not'} done!`),
    ),
  );

  const ItemComponents = items.pipe(
    mapToComponents(item => item.name, Item),
  );

  return Div(ItemComponents);
};
