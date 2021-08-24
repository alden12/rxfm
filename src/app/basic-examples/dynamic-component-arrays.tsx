import RxFM, { FC, mapToComponents } from 'rxfm';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface TodoItem {
  name: string;
  done: boolean;
}

export const ComponentArraysExample: FC = () => {
  const items = new BehaviorSubject<TodoItem[]>([
    { name: 'Item 1', done: true, },
    { name: 'Item 2', done: false, },
    { name: 'Item 3', done: true, },
  ]);

  const Item: FC<{ item: Observable<TodoItem> }> = ({ item }) => <div>
    {item.pipe(
      map(({ name, done }) => `${name} is ${done ? '' : 'not'} done!`),
    )}
  </div>;

  const ItemComponents = items.pipe(
    mapToComponents(item => item.name, item => <Item item={item} />),
  );

  return <div>{ItemComponents}</div>;
};
