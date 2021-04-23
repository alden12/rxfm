import { Button, Div, event, styles, classes, Input, attributes, mapToComponents, B } from 'rxfm';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export const HelloWorld = Div('Hello World');

export const ChildrenExample = Div(
  'Children can be strings, ',
  B('child components, '),
  'or observables: ',
  timer(0, 1000),
  's elapsed.',
);

export const StylesExample = Div('We can add styles').pipe(
  styles({
    color: 'blue',
    fontStyle: 'italic',
  })
);

export const DynamicStyles = Div('Styles can be dynamic').pipe(
  styles({
    color: timer(0, 1000).pipe(map(i => i % 2 ? 'red' : 'blue')),
  }),
);

export const ClassExample = Div('We can add CSS classes').pipe(
  classes('example-class'),
);

export const DynamicClasses = Div('Classes can be dynamic').pipe(
  classes(
    'example-class',
    timer(0, 1000).pipe(map(i => i % 2 ? 'another-class' : null)),
  ),
);

export const AttributesExample = Input().pipe(
  attributes({
    type: 'text',
    placeholder: 'We can set element attributes'
  }),
);

export const DynamicAttributes = Input().pipe(
  attributes({
    type: 'checkbox',
    checked: timer(0, 1000).pipe(map(i => i % 2 === 0))
  })
);

export const ClickCounter = () => {
  const clicks = new BehaviorSubject(0);

  return Button('clicks: ', clicks).pipe(
    event('click', () => clicks.next(clicks.value + 1)),
  );
};

const flipFlop = timer(0, 1000).pipe(
  map(i => i % 2 === 0)
);

export const ConditionalComponentsExample = Div(
  flipFlop.pipe(
    switchMap(visible => visible ? Div('Now you see me!') : of(null)),
  ),
);

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
