# RxFM - A Web Framework Built on RxJS

![Node.js CI](https://github.com/alden12/rxfm/workflows/Node.js%20CI/badge.svg?branch=master)
[![NPM](https://img.shields.io/npm/v/rxfm)](https://www.npmjs.com/package/rxfm)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/rxfm?label=gzipped)](https://bundlephobia.com/result?p=rxfm@latest)
[![MIT license](https://img.shields.io/npm/l/rxfm)](https://opensource.org/licenses/MIT)

RxFM is an experimental web framework born out of a wish for better [RxJS](https://github.com/ReactiveX/rxjs) integration, greater simplicity, and improved transparency in what a framework is doing under the hood.

I'm a big fan of RxJS and Observables in general. They open up a lot of awesome possibilities in how to structure code, with reactivity and functional practices built in from the get-go. I created this framework because I'd always been curious about whether RxJS would be enough to power an entire application, with no middle man framework to get in the way. I'd love to hear any feedback as to whether this holds any interest for you and if you'd ever consider writing apps in this style!

Aside from native RxJS integration, RxFM has several advantages over existing frameworks like React. Firstly, we don't need to worry about managing a virtual DOM because elements can be added directly to their parents as observable streams. Second, we don't have to worry about any strange render logic, as components do not need to be re-rendered, they are reactive simply by virtue of being observables.

I've tried to keep everything as minimal and clean as possible. The result reads a bit like a combination of React and RxJS, I've outlined some basic examples in the sections below so read on to have a look! It assumes some background knowledge about RxJS, but you can learn more about it on [learn RxJS](https://www.learnrxjs.io/) if you like.

* Read the full example app code in the [GitHub repo](https://github.com/alden12/rxfm/tree/master/src/app) and check out the [live demo here](https://alden12.github.io/rxfm/).
* Works best with [TypeScript](https://www.typescriptlang.org/).
* Full [JSX](https://reactjs.org/docs/introducing-jsx.html)/ [TSX](https://www.typescriptlang.org/docs/handbook/jsx.html) support.

---

## Installation
You can clone the [starter app](https://github.com/alden12/rxfm-starter) to get started right away, or install `rxfm` into an existing project using:

```sh
npm install rxfm
```

```sh
npm install rxjs@7.0.0
```
If you already have `rxjs` installed, make sure it is using the same version as `rxfm`. Currently this is `"rxjs": "^7.0.0"` (see [package.json](package.json) `peerDependencies`).

---

## Components

Components in RxFM are simply `Observables` emitting `HTMLElements`. Component names are written in PascalCase with the first letter capitalized.

### Hello World:

Below we can see how to display a simple hello world:

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

### Component Children:

We can pass lots of different kinds of things as component children:

```jsx
const ChildrenExample = () => <div>
  Children can be strings, 
  <b> child components, </b>
  or observables: {timer(0, 1000)}s elapsed.
</div>;
```

We can write code inside our JSX tags by using curly braces.

### Custom JSX Elements

In order to define components which can be used as JSX elements, they simply need to be declared as functions returning other JSX elements. For example we can use the `ChildrenExample` above as a JSX element. Elements with no children don't need to provide a closing tag.

```jsx
const CustomJsxElementExample = () => <ChildrenExample />;
```

Data can be passed into a JSX element using props, these props are then available as an object in the first argument of a component function. Component children can be accessed using the `children` prop which is implicitly available to all JSX elements. To use props with TypeScript, a component function can be assigned the `FC` (function component) type imported from RxFM. The generic type passed to `FC` will define the props available on a component as shown below.

```tsx
import RxFM, { FC } from 'rxfm';

interface FunFactsProps {
  name: string;
}

const FunFacts: FC<FunFactsProps> = ({ name, children }) => <div>
  Fun facts about {name}: {children}
</div>;

const PropsExample = () => <FunFacts name="MC Hammer">
  You can't touch this.
</FunFacts>;
```

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/components.ts) | [Live Demo](https://alden12.github.io/rxfm/)

*To use RxFM without JSX, please refer to [the previous version of the RxFM documentation](https://github.com/alden12/rxfm/blob/v2.0.0/README.md).*

---

## State & Events
State can be held in `BehaviorSubjects` and used in a similar way to the `useState` hook in React. JSX elements allow us to pass event handlers to components using event name props prefixed with `on` such as `onClick` as shown below.

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

When components store state like this, make sure to declare the state variables within the component function as above so that instances of the component don't interfere with each-other.

Using Subjects to store state gives us an advantage over React in that we don't have to wait for render for the changes to take effect, they immediately propagate into the DOM.

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/state-and-events.ts) | [Live Demo](https://alden12.github.io/rxfm/)

---

## Attributes & Styling

Element attributes and styling can be passed to components as props as shown below.

```jsx
const ClassExample = () => <div class="example-class">We can add CSS classes</div>;
```

```jsx
const StylesExample = () => <div style={{ color: "blue", fontStyle: "italic" }}>
  We can add styles
</div>;
```

```jsx
const AttributesExample = () => <input type="text" placeholder="We can set element attributes" />;
```

Style, attributes and CSS class values may be strings, or they can be observables to set them dynamically. The `class` prop may also take an array to set multiple classes on a single element.

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/attributes-and-styling.ts) | [Live Demo](https://alden12.github.io/rxfm/)

---

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

This may also be written more simply as below using the `conditional` helper function from rxfm:

```jsx
conditional(flipFlop, <div>Now you see me!</div>)
```

You may also be tempted to use `switchMap` to transform and array observable into an array of components (similar to using Array.map in React), but this will be rather inefficient as the components will be recreated each time the observable emits. The `mapToComponents` operator function should be used instead in this case as this will ensure that components are only recreated when necessary (see the [Dynamic Component Arrays](#dynamic-component-arrays) section).

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/conditional-components.ts) | [Live Demo](https://alden12.github.io/rxfm/)

---

## Component Outputs

We've seen how to pass props to a component in the [Custom JSX Elements](#custom-jsx-elements) section. Outputs can be provided by passing in callback functions as props to handle events inside the component.

```typescript
interface OptionButtonProps {
  option: string;
  setOption: (option: string) => void;
  active: Observable<boolean>;
}
```

Here each `OptionButton` component takes a `setOption` callback prop to set itself as the active option.

```tsx
const OptionButton: FC<OptionButtonProps> = ({ option, setOption, active }) => {
  const activeClassName = active.pipe(
    map(active => active && 'active')
  );

  return <button onClick={() => setOption(option)} class={['option-button', activeClassName]}>
    {option}
  </button>;
};
```

We can then store the `selectedOption` state in the component wrapping the option buttons and pass in a callback to set the selected option to each `OptionButton` instance.

```tsx
const options = ['Option 1', 'Option 2', 'Option 3'];

const ComponentOutputsExample = () => {
  const selectedOption = new BehaviorSubject<string>('Option 1');

  const optionButtons = options.map(option => {
    const active = selectedOption.pipe(
      map(selectedOpt => selectedOpt === option),
    );

    return <OptionButton option={option} setOption={option => selectedOption.next(option)} active={active} />;
  });

  return <div>
    {optionButtons}
    <div>Current Value: {selectedOption}</div>
  </div>;
};
```

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/component-io.ts) | [Live Demo](https://alden12.github.io/rxfm/)

---

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

We can then define a component taking an individual item observable:

```tsx
const Item: FC<{ item: Observable<TodoItem> }> = ({ item }) => <div>
  {item.pipe(
    map(({ name, done }) => `${name} is ${done ? '' : 'not'} done!`),
  )}
</div>;
```

Using the `mapToComponents` operator function, we can map the item array into an array of `Item` components. Here the second argument is either a function taking the item and returning its unique id (similar to the 'key' prop in React) or a property name on the item where its unique id can be found. If this argument is omitted then the item's index in the source array will be used as its id.

```tsx
const ItemComponents = items.pipe(
    mapToComponents(item => <Item item={item} />, 'name'),
  );
```

The resulting component array observable can be passed directly as a component child:
```typescript
const ComponentArraysExample = <div>{ItemComponents}</div>;
```

If our `items` subject were to then emit a new array, this would immediately be reflected by our `Item` components in the DOM. Any items with matching ids from the previous emission will reuse the existing DOM elements. 

[Code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/dynamic-component-arrays.ts) | [Live Demo](https://alden12.github.io/rxfm/)

---

## Advanced Examples

You can check out a few more complex RxFM examples at the links below to see how it might be used in a larger app. [Live Demo](https://alden12.github.io/rxfm/)

* [Todo List Example](https://github.com/alden12/rxfm/tree/master/src/app/advanced-examples/todo-list)
* [Snake Game Example](https://github.com/alden12/rxfm/tree/master/src/app/advanced-examples/snake-game)
* [Minesweeper Example](https://github.com/alden12/rxfm/tree/master/src/app/advanced-examples/minesweeper)
