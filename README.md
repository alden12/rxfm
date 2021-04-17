# RxFM - A Web Framework Built on RxJS

<!-- TODO: Refactor below to say experimental, no vDOM, no strange render and hook behavior. -->
Express your apps using nothing else but the awesome power of [RxJS](https://github.com/ReactiveX/rxjs). A beautifully minimal framework to natively code the internet in observable streams. The cleanest reactive framework out there.

RxJS lets us express data as a stream rather than as single values. This framework extends that philosophy to HTML elements, allowing the internet to be expressed as a stream of time changing elements, instantly reflected in the browser.

<!-- TODO: Add live example and starter project links back in -->
Find [RxFM on npm](https://www.npmjs.com/package/rxfm). Works best with [TypeScript](https://www.typescriptlang.org/).

## Installation:
```sh
npm install rxfm
```
<!-- TODO: Find out what needs to be installed for RxJS. -->
If you have `rxjs` installed, make sure it is the same version as RxFM is using, eg: `npm install rxjs@6.5.2`

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

## State & Events:
State can be held in `BehaviorSubjects` and used in a similar way to hooks in React. The `event` operator function lets us handle element events.
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
  // Or more simply as conditional(flipFlop, Div('Now you see me!'))
);
```

You may also be tempted to use `switchMap` to create an array of components (similar to using Array.map in React), but `mapToComponents` should be used instead in this case (see the next section).

## Component Arrays
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

Using the `mapToComponents` operator function, we can map the item array into an array of `Item` components. Here the second argument is a function taking an item and returning its unique id (similar to the 'key' prop in React).
```typescript
const itemComponents = items.pipe(
  mapToComponents(Item, item => item.name),
);
```

The resulting component array observable can be passed directly as a component child:
```typescript
const ComponentArraysExample = Div(itemComponents);
```
---
