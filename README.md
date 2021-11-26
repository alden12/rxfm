# RxFM - A Web Framework Built on RxJS

![Node.js CI](https://github.com/alden12/rxfm/workflows/Node.js%20CI/badge.svg?branch=master)
[![NPM](https://img.shields.io/npm/v/rxfm)](https://www.npmjs.com/package/rxfm)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/rxfm?label=gzipped)](https://bundlephobia.com/result?p=rxfm@latest)
[![MIT license](https://img.shields.io/npm/l/rxfm)](https://opensource.org/licenses/MIT)

RxFM *(working title)* is an experimental web framework born out of a wish for better [RxJS](https://github.com/ReactiveX/rxjs) integration, greater simplicity, and improved transparency in what a framework is doing under the hood.

I'm a big fan of RxJS and Observables in general. They open up a lot of awesome possibilities in how to structure code, with reactivity and functional practices built in from the get-go. I created this framework because I'd always been curious about whether RxJS would be enough to power an entire application, with no middle man framework to get in the way. I'd love to hear any feedback as to whether this holds any interest for you and if you'd ever consider writing apps in this style!

Aside from native RxJS integration, RxFM has several advantages over existing frameworks like React. Firstly, we don't need to worry about managing a virtual DOM because elements can be added directly to their parents as observable streams. Second, we don't have to worry about any strange render logic, as components do not need to be re-rendered, they are reactive simply by virtue of being observables.

I've tried to keep everything as minimal and clean as possible. The result reads a bit like a combination of React and RxJS, I've outlined some basic examples in the sections below so read on to have a look! It assumes some background knowledge about RxJS, but you can learn more about it on [learn RxJS](https://www.learnrxjs.io/) if you like.

* Read the full example app code in the [GitHub repo](https://github.com/alden12/rxfm/tree/master/src/app) and check out the [live demo here](https://alden12.github.io/rxfm/).
* Works best with [TypeScript](https://www.typescriptlang.org/).
* Full [JSX](https://reactjs.org/docs/introducing-jsx.html)/ [TSX](typescriptlang.org/docs/handbook/jsx.html) support.

## Installation:
You can clone the [starter app](https://github.com/alden12/rxfm-starter) to get started right away, or install `rxfm` into an existing project using:
```sh
npm install rxfm
```
```sh
npm install rxjs@7.0.0
```
If you already have `rxjs` installed, make sure it is using the same version as `rxfm`.

## Hello World:
Below we can see how to display a simple hello world. Components in RxFM are simply `Observables` emitting `HTMLElements`. Component names are written in PascalCase with the first letter capitalized.

To use RxFM with with JSX/TSX, we need to import `RxFM` in each file:
```typescript
import RxFM from 'rxfm';
```
Components are defined using JSX tags, children may be passed in between the opening and closing tags:
```jsx
const HelloWorld = <div>Hello, World!</div>;
```
The root component can be added to the DOM by subscribing to it and adding its element to the document:
```typescript
HelloWorld.subscribe(el => document.body.appendChild(el));
```
The root component should be the only subscribed component in our application, and indeed ideally the only use of `subscribe` at all! All being well, other observables should piggyback on the application subscription and are subscribed by virtue of being a part of the component stream. This way a single subscription at the app root can set the entire application in motion!

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/components.ts) | [Live Demo](https://alden12.github.io/rxfm/)

### Component Children:

We can pass lots of different kinds of things as component children:
```jsx
const ChildrenExample = () => <div>
  Children can be strings, 
  <b>child components, </b>
  or observables: {timer(0, 1000)}s elapsed.
</div>;
```
We can write code inside our JSX tags by using curly braces.

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/components.ts) | [Live Demo](https://alden12.github.io/rxfm/)

## State & Events:
State can be held in `BehaviorSubjects` and used in a similar way to the `useState` hook in React. The `event` operator function lets us handle element events.
```jsx
import RxFM from 'rxfm';
import { BehaviorSubject } from 'rxjs';

const ClickCounter = () => {
  const clicks = new BehaviorSubject(0);

  return <button onClick={() => clicks.next(clicks.value + 1)}>
    Clicks: {clicks}
  </button>;
};
```

Here the `event` operator is what I've called a "component operator". These are operator functions taking a component observable, processing its element in some way, and returning the same component observable. In this case the component operator adds an event listener to the element.

When components store state like this, they should be declared as functions as above so that instances of the component don't interfere with each-other.

Using Subjects to store state gives us an advantage over React in that we don't have to wait for render for the changes to take effect, they immediately propagate into the DOM.

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/state-and-events.ts) | [Live Demo](https://alden12.github.io/rxfm/)

## Attributes & Styling:
Element attributes and styling can be set using operator functions imported from `rxfm`:

```jsx
const StylesExample = () => <div style={{ color: "blue", fontStyle: "italic" }}>
  We can add styles
</div>;
```
```jsx
const ClassExample = () => <div class="example-class">We can add CSS classes</div>;
```
```jsx
const AttributesExample = () => <input type="text" placeholder="We can set element attributes" />;
```

Style, attributes and CSS class values may be strings, or they can be observables to set them dynamically.

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/attributes-and-styling.ts) | [Live Demo](https://alden12.github.io/rxfm/)

## Conditionally Displaying Components
We can conditionally add a component using the `switchMap` operator function from `RxJS`.

For illustrative purposes, we can create an observable which emits true or false periodically every second:
```typescript
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

const flipFlop = timer(0, 1000).pipe(
  map(i => i % 2 === 0)
);
```

With `switchMap` we can map an observable to a component observable depending on a condition, or to an observable emitting one of either: `null | undefined | false` to remove it from the DOM.
```jsx
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

const ConditionalComponentsExample = () => <div>
  {flipFlop.pipe(
    switchMap(visible => visible ? <div>Now you see me!</div> : of(null)),
  )}
</div>;
```

This may also be written more simply as: `conditional(flipFlop, <div>Now you see me!</div>)` using the `conditional` helper function from rxfm.

You may also be tempted to use `switchMap` to transform and array observable into an array of components (similar to using Array.map in React), but this will be rather inefficient as the components will be recreated each time the observable emits. The `mapToComponents` operator function should be used instead in this case as this will ensure that components are only recreated when necessary (see the "Dynamic Component Arrays" section).

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/conditional-components.ts) | [Live Demo](https://alden12.github.io/rxfm/)

## Component Inputs & Outputs

Providing inputs to a component is as simple as passing them in as function arguments. Outputs can be provided by passing in callback functions to handle events inside the component.

```typescript
interface OptionButtonProps {
  option: string;
  setOption: (option: string) => void;
  active: Observable<boolean>;
}
```
```tsx
const OptionButton: FC<OptionButtonProps> = ({ option, setOption, active }) => {
  const classes = active.pipe(
    map(active => ['option-button', active && 'active'])
  );
  
  const handleClick = () => setOption(option);

  return <button class={classes} onClick={handleClick}>{option}</button>;
};
```
```tsx
const options = ['Option 1', 'Option 2', 'Option 3'];

const ComponentIOExample = () => {
  const selectedOption = new BehaviorSubject<string>('Option 1');
  const setOption = (option: string) => selectedOption.next(option);

  const Options = options.map(option => {
    const active = selectedOption.pipe(map(selectedOpt => selectedOpt === option));
    return <OptionButton option={option} setOption={setOption} active={active} />;
  });

  return <div>
    {Options}
    <div>Current Value: {selectedOption}</div>
  </div>;
};
```

Component children can be passed in using the `ComponentChild` type. A variable number of component children can be passed in using a spread array:

```tsx
const Card: FC = ({ children }) => <div class="card">{children}</div>;

// We could also simply pass all props down to the parent element to create a wrapper component:
const CardWithDefaultProps: FC<HTMLElementProps<'div'>> = props => <div {...props} class="card" />;
```

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/component-io.ts) | [Live Demo](https://alden12.github.io/rxfm/)

## Dynamic Component Arrays
We can generate dynamic component arrays from array observables using the `mapToComponents` operator function from `rxfm`. This ensures that component arrays are efficiently rendered and are not regenerated each time the source data changes.

We'll start with an observable emitting an array of items:
```typescript
interface TodoItem {
  name: string;
  done: boolean;
}

const items = new BehaviorSubject<TodoItem[]>([
  { name: 'Item 1', done: true, },
  { name: 'Item 2', done: false, },
]);
```

We can then define a function to create a component from an individual item observable:
```tsx
const Item: FC<{ item: Observable<TodoItem> }> = ({ item }) => <div>
  {item.pipe(
    map(({ name, done }) => `${name} is ${done ? '' : 'not'} done!`),
  )}
</div>;
```

Using the `mapToComponents` operator function, we can map the item array into an array of `Item` components. Here the first argument is a function taking an item and returning its unique id (similar to the 'key' prop in React).
```tsx
const ItemComponents = items.pipe(
    mapToComponents(item => item.name, item => <Item item={item} />),
  );
```

The resulting component array observable can be passed directly as a component child:
```typescript
const ComponentArraysExample = <div>{ItemComponents}</div>;
```

If our `items` subject were to then emit a new array, this would be immediately be reflected by our `Item` components in the DOM. Any items with matching ids from the previous emission will reuse the existing DOM elements. 

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/dynamic-component-arrays.ts) | [Live Demo](https://alden12.github.io/rxfm/)


## Advanced Examples

You can check out a few more complex RxFM examples at the links below to see how it might be used in a larger app. [Live Demo](https://alden12.github.io/rxfm/)

* [Todo List Example](https://github.com/alden12/rxfm/tree/master/src/app/advanced-examples/todo-list)
* [Snake Game Example](https://github.com/alden12/rxfm/tree/master/src/app/advanced-examples/snake-game)
* [Minesweeper Example](https://github.com/alden12/rxfm/tree/master/src/app/advanced-examples/minesweeper)

---
