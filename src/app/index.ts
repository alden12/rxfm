import { attribute, ComponentChild, Div, H1, H3, styles, classes } from 'rxfm';
import {
  HelloWorld,
  ChildrenExample,
  StylesExample,
  DynamicStyles,
  ClassExample,
  DynamicClasses,
  AttributesExample,
  DynamicAttributes,
  ClickCounter,
  ConditionalComponentsExample,
  ComponentArraysExample,
} from './basic-examples';
import { TodoList } from './todo-example';
import { SnakeExample } from './snake-example';

import './styles.css';

const Example = (title: string, ...children: ComponentChild[]) => Div(
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
  Example('Conditional Components', ConditionalComponentsExample),
  Example('Component Arrays', ComponentArraysExample),
  Example('Todo List Example', TodoList),
  Example('Snake Example', SnakeExample),
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
