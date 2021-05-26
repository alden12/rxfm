import { attribute, ComponentChild, Div, H1, H3, classes, Span, A, attributes } from 'rxfm';
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
  ComponentIOExample,
} from './basic-examples';
import { TodoList, SnakeGame, Minesweeper } from './advanced-examples';

import './styles.css';

document.title = 'RxFM Examples';

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
  Example('Component Inputs & Outputs', ComponentIOExample),
  Example('Component Arrays', ComponentArraysExample),
  Example('Todo List Example', TodoList),
  Example('Snake Example', SnakeGame),
  Example('Minesweeper Example', Minesweeper),
).pipe(
  classes('examples'),
);

const GithubLink = A`(GitHub)`.pipe(
  attributes({ href: 'https://github.com/alden12/rxfm' }),
  classes('github-link'),
);

const Title = Span(
  H1`RxFM Examples`,
  GithubLink,
).pipe(
  classes('app-title'),
);

const App = Div(Title,  Examples).pipe(
  attribute('id', 'app'),
);

App.subscribe(element => document.body.appendChild(element));
