# RxFM - A Web Framework Built on RxJS

Express your apps using nothing else but the awesome power of [RxJS](https://github.com/ReactiveX/rxjs). A beautifully minimal framework to natively code the internet in observable streams. The cleanest reactive framework out there.

RxJS lets us express data as a stream rather than as single values. This framework extends that philosophy to HTML elements, allowing the internet to be expressed as a stream of time changing elements, instantly reflected in the browser.

Find [RxFM on npm](https://www.npmjs.com/package/rxfm). Works best with [TypeScript](https://www.typescriptlang.org/).

## Installation:
```sh
npm install rxfm
```
If you have `rxjs` installed, make sure it is the same version as RxFM is using `npm install rxjs@6.5.2`

## Hello World:
Below we can see how to display a simple hello world. Components in RxFM are simply `Observables` emitting `Elements`. Component names are written in PascalCase with the first letter capitalized.
```typescript
// Basic component creators can be imported from 'rxfm'
import { Div } from 'rxfm';

// These may take any number of children as arguments, including observables and other components
const HelloWorld = Div('Hello, World!');

// The root component can be added to the DOM by subscribing to it and adding its element to the document
HelloWorld.subscribe(el => document.body.appendChild(el));
```

## State & Events:
State can be held in Behavior Subjects and used in a similar way to hooks in React. The `event` operator function lets us handle element events.
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
Element attributes and styling can be set using operator functions for each. Style, attributes and CSS class values may also be observables.
```typescript
import { Div, styles, classes, attributes } from 'rxfm';

const StylesExample = Div('We can add styles').pipe(
  styles({
    color: 'blue',
    fontStyle: 'italic',
  })
);

const ClassExample = Div('We can add CSS classes').pipe(
  classes('example-class'),
);

const AttributesExample = Input().pipe(
  attributes({
    type: 'text',
    placeholder: 'We can set element attributes'
  }),
);
```

## Conditionally Displaying Components
We can conditionally add a component using the `switchMap` operator function. You may also be tempted to use switchMap to create an array of components, but `mapToComponents` should instead be used in this case (see the next section).
```typescript
import { Div } from 'rxfm';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const Visible = Div('Now you see me!');
const Hidden = Div(`Now you don't`);

const ConditionalComponentsExample = Div(
  // An observable emitting increasing numbers at a period of 1 second
  timer(0, 1000).pipe(
    // With switchMap we can map to a different component observable depending on a condition, or null to remove it completely
    switchMap(i => i % 2 === 0 ? Visible : Hidden),
  ),
);
```

## Component Arrays
We can generate dynamic component arrays from array observables using the `mapToComponents` operator function. This ensures that component arrays are efficiently rendered and are not regenerated each time the source data changes.
```typescript
import { Div, mapToComponents } from 'rxfm';
import { BehaviorSubject, Observable } from 'rxjs';

interface TodoItem {
  name: string;
  done: boolean;
}

const ComponentArraysExample = () => {
  // Start with an observable emitting an array of items
  const items = new BehaviorSubject<TodoItem[]>([
    { name: 'Item 1', done: true, },
    { name: 'Item 2', done: false, },
  ]);

  // We can define a function to create a component from an item observable
  const Item = (item: Observable<TodoItem>) => Div(
    item.pipe(
      map(({ name, done }) => `${name} is ${done ? '' : 'not'} done!`),
    ),
  );

  const itemComponents = items.pipe(
    // The mapToComponents operator function generates a dynamic array of components
    mapToComponents(
      // The first argument is the function creating a component from an item
      Item,
      // The second takes an item and returns its unique id (similar to the 'key' prop in React)
      item => item.name,
    ),
  );

  // The resulting component array observable can be passed directly as a component child
  return Div(itemComponents);
};
```
