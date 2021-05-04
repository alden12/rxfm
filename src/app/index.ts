import { attribute, ComponentChild, Div, H1, H3, classes } from 'rxfm';
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
  TaggedTemplateExample,
} from './basic-examples';
import { TodoList, SnakeGame } from './advanced-examples';

import './styles.css';

const Example = (title: string, ...children: ComponentChild[]) => Div(
  H3(title).pipe(classes('example-title')),
  ...children,
).pipe(
  classes('example'),
);

const Examples = Div(
  Example('Hello World', HelloWorld),
  Example('Children', ChildrenExample),
  Example('Tagged Templates', TaggedTemplateExample),
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
  Example('Snake Example', SnakeGame),
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
