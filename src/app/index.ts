import {
  attribute,
  button,
  ChildComponent,
  div,
  event,
  h1,
  h3,
  styles,
  classes,
  input,
  attributes,
  mapToComponents,
  selectFrom,
  b,
} from 'rxfm';
import { BehaviorSubject, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { todoList } from './todo-example';
import './styles.css';

const helloWorld = div('Hello World');

const childrenExample = div(
  'Children can be strings, ',
  b('child components, '),
  'or observables: ',
  timer(0, 1000),
  's elapsed.',
);

const stylesExample = div('We can add styles').pipe(
  styles({
    color: 'blue',
    fontStyle: 'italic',
  })
);

const dynamicStyles = div('Styles can be dynamic').pipe(
  styles({
    color: timer(0, 1000).pipe(map(i => i % 2 ? 'red' : 'blue')),
  }),
);

const classExample = div('We can add css classes').pipe(
  classes('example-class'),
);

const dynamicClasses = div('Classes can be dynamic').pipe(
  classes(
    'example-class',
    timer(0, 1000).pipe(map(i => i % 2 ? 'another-class' : null)),
  ),
);

const attributesExample = input().pipe(
  attributes({
    type: 'text',
    placeholder: 'We can set element attributes'
  }),
);

const dynamicAttributes = input().pipe(
  attributes({
    type: 'checkbox',
    checked: timer(0, 1000).pipe(map(i => i % 2 === 0))
  })
);

const clickCounter = () => {
  const clicks = new BehaviorSubject(0);

  return button('clicks: ', clicks).pipe(
    event('click', () => clicks.next(clicks.value + 1)),
  );
};

const mapToComponentsExample = of([
  { name: 'Item 1', done: true, },
  { name: 'Item 2', done: false, },
  { name: 'Item 3', done: true, },
]).pipe(
  mapToComponents(
    item => div(
      selectFrom(item, 'name'),
      item.pipe(
        map(({ done }) => done ? ' is done!' : ' is not done yet.'),
      ),
    ),
    item => item.name,
  ),
);

const example = (title: string, ...children: ChildComponent[]) => div(
  h3(title).pipe(styles({ margin: '10px 0' })),
  ...children,
).pipe(
  classes('example'),
);

const examples = div(
  example('Hello World', helloWorld),
  example('Children', childrenExample),
  example('Styles', stylesExample),
  example('Dynamic Styles', dynamicStyles),
  example('CSS Classes', classExample),
  example('Dynamic CSS Classes', dynamicClasses),
  example('Attributes', attributesExample),
  // example('Dynamic Attributes', dynamicAttributes),
  example('State', clickCounter()),
  example('Component Arrays', mapToComponentsExample),
  example('Todo List Example', todoList()),
).pipe(
  classes('examples'),
);

const app = div(
  h1('RxFM Examples'),
  examples,
).pipe(
  attribute('id', 'app'),
);

app.subscribe(element => document.body.appendChild(element));
