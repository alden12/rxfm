// Demo entry. A plain `.ts` module (so Vite treats it as part of the graph) that
// imports the Reactive TS example components and lays them out. The example components
// themselves are authored in Reactive TS (`.rts`); importing them here pulls them into
// the module graph so the Reactive TS Vite plugin transforms each one. The layout below
// is ordinary RxFM — no derived expressions — so it needs no lifting.
import { addToView, attribute, ComponentChild, Div, H1, H3, classes, Span, A } from "rxfm";
import {
  HelloWorld,
  ChildrenExample,
  TaggedTemplateExample,
} from "./basic/components.rts";
import {
  StylesExample,
  DynamicStyles,
  ClassExample,
  DynamicClasses,
  AttributesExample,
  DynamicAttributes,
  AttributeExample,
} from "./basic/attributes-and-styling.rts";
import { ClickCounter } from "./basic/state-and-events.rts";
import { ConditionalComponentsExample } from "./basic/conditional-components.rts";
import { ComponentIOExample } from "./basic/component-io.rts";
import { ComponentArraysExample } from "./basic/dynamic-component-arrays.rts";
import { TodoList } from "./todo-list/todo-list.rts";
import { SnakeGame } from "./snake-game/snake-game.rts";
import { Minesweeper } from "./minesweeper/minesweeper.rts";

import "./styles.css";

document.title = "RxFM Examples";

const Example = (title: string, ...children: ComponentChild[]) => Div(
  H3(title).pipe(classes`example-title`),
  ...children,
).pipe(
  classes`example`,
);

const Examples = Div(
  Example("Hello World", HelloWorld),
  Example("Children", ChildrenExample),
  Example("Tagged Templates", TaggedTemplateExample),
  Example("Styles", StylesExample),
  Example("Dynamic Styles", DynamicStyles),
  Example("CSS Classes", ClassExample),
  Example("Dynamic CSS Classes", DynamicClasses),
  Example("Attributes", AttributesExample),
  Example("Dynamic Attributes", DynamicAttributes),
  Example("Individual Attribute", AttributeExample),
  Example("State", ClickCounter),
  Example("Conditional Components", ConditionalComponentsExample),
  Example("Component Inputs & Outputs", ComponentIOExample),
  Example("Component Arrays", ComponentArraysExample),
  Example("Todo List Example", TodoList),
  Example("Snake Example", SnakeGame),
  Example("Minesweeper Example", Minesweeper),
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

addToView(App);
