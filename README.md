# RxFM - A Web Framework Built on RxJS

RxFM *(working title)* is an experimental web framework born out of a wish for better [RxJS](https://github.com/ReactiveX/rxjs) integration, greater simplicity, and improved transparency in what a framework is doing under the hood.

I'm a big fan of RxJS and Observables in general. They open up a lot of awesome possibilities in how to structure code, with reactivity and functional practices built in from the get-go. I created this framework because I'd always been curious about whether RxJS would be enough to power an entire application, with no middle man framework to get in the way. I'd love to hear any feedback as to whether this holds any interest for you and if you'd ever consider writing apps in this style!

Aside from native RxJS integration, RxFM has several advantages over existing frameworks like React. Firstly, we don't need to worry about managing a virtual DOM because elements can be added directly to their parents as observable streams. Second, we don't have to worry about any strange render logic, as components do not need to be re-rendered, they are reactive simply by virtue of being observables.

I've tried to keep everything as minimal and clean as possible. The result reads a bit like a combination of React and RxJS, I've outlined some basic examples in the sections below so read on to have a look! It assumes some background knowledge about RxJS, but you can learn more about it on [learn RxJS](https://www.learnrxjs.io/) if you like.

* Read the full example app code in the [GitHub repo](https://github.com/alden12/rxfm/tree/master/src/app) and check out the [live demo here](https://alden12.github.io/rxfm/).
* Find [RxFM on npm](https://www.npmjs.com/package/rxfm).

Works best with [TypeScript](https://www.typescriptlang.org/).

## Installation:
You can clone the [starter app](https://github.com/alden12/rxfm-starter) to get started right away, or install `rxfm` into an existing project using:
```sh
npm install rxfm
```
If you have `rxjs` installed already, make sure it is using the same version as RxFM, eg: `npm install rxjs@6.5.2`

## Hello World:
Below we can see how to display a simple hello world. Components in RxFM are simply `Observables` emitting `Elements`. Component names are written in PascalCase with the first letter capitalized.

Basic component creators can be imported from `rxfm`:
```typescript
import { Div } from 'rxfm';
```
These may take any number of children as arguments, including strings, observables and other components:
```typescript
const HelloWorld = Div('Hello, World!');
```
The root component can be added to the DOM by subscribing to it and adding its element to the document:
```typescript
HelloWorld.subscribe(el => document.body.appendChild(el));
```
The root component should be the only subscribed component in our application, and indeed ideally the only use of `subscribe` at all! All being well, other observables should piggyback on the application subscription and are subscribed by virtue of being a part of the component stream. This way a single subscription at the app root can set the entire application in motion!

[Full components example code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/components.ts)

## State & Events:
State can be held in `BehaviorSubjects` and used in a similar way to the `useState` hook in React. The `event` operator function lets us handle element events.
```typescript
import { Button, event } from 'rxfm';
import { BehaviorSubject } from 'rxjs';

const ClickCounter = () => {
  // Behavior Subjects can be used to hold state
  const clicks = new BehaviorSubject(0);

  return Button('clicks: ', clicks).pipe(
    // Events are handled using the event operator function
    event('click', () => clicks.next(clicks.value + 1)),
  );
};
```
Here the `event` operator is what I've called a "component operator". These are operator functions taking a component observable, processing its element in some way, and returning the same component observable. In this case the component operator adds an event listener to the element.

Using Subjects to store state like this gives us an advantage over React in that we don't have to wait for render for the changes to take effect, they immediately propagate into the DOM.

[Full state and events example code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/state-and-events.ts)

## Attributes & Styling:
Element attributes and styling can be set using operator functions imported from `rxfm`. Style, attributes and CSS class values may be strings, or they can be observables to set them dynamically.
```typescript
import { styles, classes, attributes, Div } from 'rxfm';
```
```typescript
const StylesExample = Div('We can add styles').pipe(
  styles({
    color: 'blue',
    fontStyle: 'italic',
  })
);
```
```typescript
const ClassExample = Div('We can add CSS classes').pipe(
  classes('example-class'),
);
```
```typescript
const AttributesExample = Input().pipe(
  attributes({
    type: 'text',
    placeholder: 'We can set element attributes'
  }),
);
```

[Full attributes, classes and styling example code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/attributes-and-styling.ts)

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
```typescript
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

const ConditionalComponentsExample = Div(
  flipFlop.pipe(
    switchMap(visible => visible ? Div('Now you see me!') : of(null)),
  ),
  // Or more simply as: conditional(flipFlop, Div('Now you see me!')), using the 'conditional' helper function from rxfm.
);
```

You may also be tempted to use `switchMap` to transform and array observable into an array of components (similar to using Array.map in React), but this will be rather inefficient as the components will be recreated each time the observable emits. The `mapToComponents` operator function should be used instead in this case as this will ensure that components are only recreated when necessary (see the next section).

[Full conditional components example code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/conditional-components.ts)

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
```typescript
const Item = (item: Observable<TodoItem>) => Div(
  item.pipe(
    map(({ name, done }) => `${name} is ${done ? '' : 'not'} done!`),
  ),
);
```

Using the `mapToComponents` operator function, we can map the item array into an array of `Item` components. Here the first argument is a function taking an item and returning its unique id (similar to the 'key' prop in React).
```typescript
const ItemComponents = items.pipe(
  mapToComponents(item => item.name, Item),
);
```

The resulting component array observable can be passed directly as a component child:
```typescript
const ComponentArraysExample = Div(ItemComponents);
```

If our `items` subject were to then emit a new array, this would be immediately be reflected by our `Item` components in the DOM. Any items with matching ids from the previous emission will reuse the existing DOM elements. 

[Full dynamic component arrays example code](https://github.com/alden12/rxfm/blob/master/src/app/basic-examples/dynamic-component-arrays.ts)


## Advanced Examples

You can check out a few more complex RxFM examples at the links below to see how it might be used in a larger app.

* [Todo List Example](https://github.com/alden12/rxfm/tree/master/src/app/advanced-examples/todo-list)
* [Snake Game Example](https://github.com/alden12/rxfm/tree/master/src/app/advanced-examples/snake-game)

---
