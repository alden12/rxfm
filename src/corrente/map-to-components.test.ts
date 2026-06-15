import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { mapToComponents } from './map-to-components';
import { Div } from './components';
import { ElementType } from './components/component';

interface Item { id: number; label: string; }

function collect<T>(observable: Observable<T>): { values: T[]; subscription: Subscription } {
  const values: T[] = [];
  const subscription = observable.subscribe(value => values.push(value));
  return { values, subscription };
}

/** The most recent emission, cast to an element array. */
function lastRender<T>(collected: { values: T[] }): ElementType[] {
  return collected.values[collected.values.length - 1] as unknown as ElementType[];
}

/** A creation function rendering each item's label as the element's text. */
const labelComponent = (item$: Observable<Item>) => Div(item$.pipe(map(item => item.label)));

describe('mapToComponents', () => {
  it('starts with an empty array', () => {
    const source = new BehaviorSubject<Item[]>([{ id: 1, label: 'a' }]);
    expect(collect(source.pipe(mapToComponents(labelComponent, 'id'))).values[0]).toEqual([]);
  });

  it('renders one element per item, in order', () => {
    const source = new BehaviorSubject<Item[]>([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ]);
    const collected = collect(source.pipe(mapToComponents(labelComponent, 'id')));
    expect(lastRender(collected).map(el => el.textContent)).toEqual(['a', 'b']);
  });

  it('reuses the same element instance for a stable id across updates', () => {
    const source = new BehaviorSubject<Item[]>([{ id: 1, label: 'a' }]);
    const collected = collect(source.pipe(mapToComponents(labelComponent, 'id')));
    const original = lastRender(collected)[0];

    source.next([{ id: 1, label: 'a' }, { id: 2, label: 'b' }]); // add a sibling
    expect(lastRender(collected)[0]).toBe(original); // same element reused, not recreated
  });

  it('keeps an existing item component live after a later array change', () => {
    const source = new BehaviorSubject<Item[]>([{ id: 1, label: 'a' }]);
    const collected = collect(source.pipe(mapToComponents(labelComponent, 'id')));
    const element = lastRender(collected)[0];

    source.next([{ id: 1, label: 'a' }, { id: 2, label: 'b' }]); // unrelated change (add)
    source.next([{ id: 1, label: 'A' }, { id: 2, label: 'b' }]); // update item 1

    expect(element.textContent).toBe('A'); // the reused element still reacts to its item observable
  });

  it('reorders existing elements to match the new order, reusing them', () => {
    const source = new BehaviorSubject<Item[]>([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ]);
    const collected = collect(source.pipe(mapToComponents(labelComponent, 'id')));
    const [first, second] = lastRender(collected);

    source.next([{ id: 2, label: 'b' }, { id: 1, label: 'a' }]);

    const reordered = lastRender(collected);
    expect(reordered).toEqual([second, first]); // same instances, swapped order
  });

  it('removes elements and tears down their components when items leave', () => {
    const teardowns: number[] = [];
    const creation = (item$: Observable<Item>) => {
      let id: number;
      return Div(item$.pipe(map(item => { id = item.id; return item.label; }))).pipe(
        finalize(() => teardowns.push(id)),
      );
    };
    const source = new BehaviorSubject<Item[]>([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ]);
    const collected = collect(source.pipe(mapToComponents(creation, 'id')));

    source.next([{ id: 1, label: 'a' }]); // drop item 2

    expect(lastRender(collected).map(el => el.textContent)).toEqual(['a']);
    expect(teardowns).toEqual([2]);
  });

  it('uses the array index as the id by default', () => {
    const source = new BehaviorSubject([{ id: 1, label: 'a' }, { id: 2, label: 'b' }]);
    const collected = collect(source.pipe(mapToComponents(labelComponent)));
    const [first, second] = lastRender(collected);

    // Same positions keep the same elements even though the items (and ids) differ.
    source.next([{ id: 9, label: 'x' }, { id: 8, label: 'y' }]);
    const updated = lastRender(collected);
    expect(updated[0]).toBe(first);
    expect(updated[1]).toBe(second);
    expect(updated.map(el => el.textContent)).toEqual(['x', 'y']);
  });

  it('derives the id from a function', () => {
    const source = new BehaviorSubject<Item[]>([{ id: 1, label: 'a' }]);
    const collected = collect(source.pipe(mapToComponents(labelComponent, item => item.id)));
    const element = lastRender(collected)[0];

    source.next([{ id: 1, label: 'a' }, { id: 2, label: 'b' }]);
    expect(lastRender(collected)[0]).toBe(element); // matched by id-from-function
  });

  it('errors if the id function returns a non string/number', () => {
    const source = new BehaviorSubject<Item[]>([{ id: 1, label: 'a' }]);
    let error: unknown;
    source
      .pipe(mapToComponents(labelComponent, (() => ({})) as never))
      .subscribe({ next: () => undefined, error: caught => { error = caught; } });
    expect(error).toBeInstanceOf(TypeError);
  });
});
