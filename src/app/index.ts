import {
  attribute,
  Button,
  ChildComponent,
  Div,
  event,
  H1,
  H3,
  styles,
  classes,
  Input,
  attributes,
  mapToComponents,
  selectFrom,
  B,
} from 'rxfm';
import { BehaviorSubject, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { TodoList } from './todo-example';
import './styles.css';

const HelloWorld = Div('Hello World');

const ChildrenExample = Div(
  'Children can be strings, ',
  B('child components, '),
  'or observables: ',
  timer(0, 1000),
  's elapsed.',
);

const StylesExample = Div('We can add styles').pipe(
  styles({
    color: 'blue',
    fontStyle: 'italic',
  })
);

const DynamicStyles = Div('Styles can be dynamic').pipe(
  styles({
    color: timer(0, 1000).pipe(map(i => i % 2 ? 'red' : 'blue')),
  }),
);

const ClassExample = Div('We can add css classes').pipe(
  classes('example-class'),
);

const DynamicClasses = Div('Classes can be dynamic').pipe(
  classes(
    'example-class',
    timer(0, 1000).pipe(map(i => i % 2 ? 'another-class' : null)),
  ),
);

const AttributesExample = Input().pipe(
  attributes({
    type: 'text',
    placeholder: 'We can set element attributes'
  }),
);

const DynamicAttributes = Input().pipe(
  attributes({
    type: 'checkbox',
    checked: timer(0, 1000).pipe(map(i => i % 2 === 0))
  })
);

const ClickCounter = () => {
  const clicks = new BehaviorSubject(0);

  return Button('clicks: ', clicks).pipe(
    event('click', () => clicks.next(clicks.value + 1)),
  );
};

const MapToComponentsExample = of([
  { name: 'Item 1', done: true, },
  { name: 'Item 2', done: false, },
  { name: 'Item 3', done: true, },
]).pipe(
  mapToComponents(
    item => Div(
      item.pipe(map(({ name }) => name)),
      item.pipe(
        map(({ done }) => done ? ' is done!' : ' is not done yet.'),
      ),
    ),
    item => item.name,
  ),
);

const Example = (title: string, ...children: ChildComponent[]) => Div(
  H3(title).pipe(styles({ margin: '10px 0' })),
  ...children,
).pipe(
  classes('example'),
);

const Examples = Div(
  Example('Hello World', HelloWorld),
  Example('Children', ChildrenExample),
  Example('Styles', StylesExample),
  Example('Dynamic Styles', DynamicStyles),
  Example('CSS Classes', ClassExample),
  Example('Dynamic CSS Classes', DynamicClasses),
  Example('Attributes', AttributesExample),
  Example('Dynamic Attributes', DynamicAttributes),
  Example('State', ClickCounter),
  Example('Component Arrays', MapToComponentsExample),
  Example('Todo List Example', TodoList),
).pipe(
  classes('examples'),
);

const App = Div(
  H1('RxFM Examples'),
  Examples,
).pipe(
  attribute('id', 'app'),
);

App.subscribe(element => document.body.appendChild(element));
