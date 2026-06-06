// Demo entry. A plain `.ts` module (so Vite treats it as part of the graph) that
// imports the tsrx example components and lays them out. The example components
// themselves are authored in tsrx (`.tsrx`); importing them here pulls them into
// the module graph so the tsrx Vite plugin transforms each one. The layout below
// is ordinary RxFM — no derived expressions — so it needs no lifting.
import { attribute, ComponentChild, Div, H1, H3, classes, Span, A } from 'rxfm';
import {
  HelloWorld,
  ChildrenExample,
  TaggedTemplateExample,
} from './basic/components.tsrx';
import {
  StylesExample,
  DynamicStyles,
  ClassExample,
  DynamicClasses,
  AttributesExample,
  DynamicAttributes,
  AttributeExample,
} from './basic/attributes-and-styling.tsrx';
import { ClickCounter } from './basic/state-and-events.tsrx';
import { ConditionalComponentsExample } from './basic/conditional-components.tsrx';
import { ComponentIOExample } from './basic/component-io.tsrx';
import { ComponentArraysExample } from './basic/dynamic-component-arrays.tsrx';
import { TodoList } from './todo-list/todo-list.tsrx';
import { SnakeGame } from './snake-game/snake-game.tsrx';
import { Minesweeper } from './minesweeper/minesweeper.tsrx';

import './styles.css';

document.title = 'RxFM Examples';

const Example = (title: string, ...children: ComponentChild[]) => Div(
  H3(title).pipe(classes`example-title`),
  ...children,
).pipe(
  classes`example`,
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
  Example('Individual Attribute', AttributeExample),
  Example('State', ClickCounter),
  Example('Conditional Components', ConditionalComponentsExample),
  Example('Component Inputs & Outputs', ComponentIOExample),
  Example('Component Arrays', ComponentArraysExample),
  Example('Todo List Example', TodoList),
  Example('Snake Example', SnakeGame),
  Example('Minesweeper Example', Minesweeper),
).pipe(
  classes`examples`,
);

const GithubLink = A`(GitHub)`.pipe(
  attribute.href`https://github.com/alden12/rxfm`,
  classes`github-link`,
);

const Title = Span(
  H1`RxFM Examples`,
  GithubLink,
).pipe(
  classes`app-title`,
);

const App = Div(Title, Examples).pipe(
  attribute.id`app`,
);

App.subscribe(element => document.body.appendChild(element));
