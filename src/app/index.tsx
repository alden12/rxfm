import RxFM, { FC } from 'rxfm';
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
  ComponentIOExample,
  JSXExample,
} from './basic-examples';
import { TodoList, SnakeGame, Minesweeper } from './advanced-examples';

import './styles.css';

document.title = 'RxFM Examples';

const Example: FC<{ title: string }> = ({ title, children }) => <div class="example">
  <h3 class="example-title">{title}</h3>
  {children}
</div>;

const Examples = () => <div class="examples">
  <Example title="Hello World">{HelloWorld}</Example>
  <Example title="Children">
    <ChildrenExample />
  </Example>
  <Example title="Styles">
    <StylesExample />
  </Example>
  <Example title="Dynamic Styles">
    <DynamicStyles />
  </Example>
  <Example title="CSS Classes">
    <ClassExample />
  </Example>
  <Example title="Dynamic CSS Classes">
    <DynamicClasses />
  </Example>
  <Example title="Attributes">
    <AttributesExample />
  </Example>
  <Example title="Dynamic Attributes">
    <DynamicAttributes />
  </Example>
  <Example title="State">
    <ClickCounter />
  </Example>
  <Example title="Conditional Components">{ConditionalComponentsExample}</Example>
  <Example title="Component Inputs & Outputs">{ComponentIOExample}</Example>
  <Example title="Component Arrays">{ComponentArraysExample}</Example>
  <Example title="Todo List Example">
    <TodoList />
  </Example>
  <Example title="Snake Example">{SnakeGame}</Example>
  <Example title="Minesweeper Example">{Minesweeper}</Example>
  <Example title="JSX">{JSXExample}</Example>
</div>;

const GithubLink = () => <a href="https://github.com/alden12/rxfm" class="github-link">(GitHub)</a>;

const Title = () => <span class="app-title">
  <h1>RxFM Examples</h1>
  <GithubLink />
</span>;

const App = <div id="app">
  <Title />
  <Examples />
</div>;

App.subscribe(element => document.body.appendChild(element));
