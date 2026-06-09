# RxFM Guide

> The full walkthrough of RxFM in the **Reactive TS** style — components, state & events, attributes,
> conditional rendering, inputs/outputs, and dynamic lists. New here? Start with the
> [README](../README.md) for the pitch and a quick example, then [Getting started](getting-started.md)
> to set up your editor and build. Prefer plain RxJS with no build step? See the
> [plain-TypeScript reference](plain-typescript.md). Reactive TS is experimental — see
> [How Reactive TS works](#how-reactive-ts-works) below and the [roadmap](../reactive-ts/ROADMAP.md).

RxFM is an experimental web framework built on [RxJS](https://github.com/ReactiveX/rxjs): a
**component is just an `Observable<HTMLElement>`**. There's no virtual DOM and no re-render cycle —
elements are reactive simply because they're observable streams, and a single mount at the app root
(`addToView`) sets the whole app in motion.

---

## What is Reactive TS?

RxJS streams are powerful, but they don't compose like ordinary values: you can't just write
`count * 2` or `a === b` over an observable — you reach for `map`, `combineLatest`, and `switchMap`.

**Reactive TS lets you treat streams as if they were normal variables.** Write the plain expression and
Reactive TS wires up the reactivity for you:

```typescript
const doubled = count * 2;               // a stream that re-emits whenever count changes
const isActive = selected === option;    // a boolean stream
const view = visible ? Div`Hi` : null;   // swaps the component reactively
```

Why it's nice:

- **Less ceremony** — derived state reads like the maths it is, not a pipeline of operators.
- **Still just RxJS** — every expression lifts to the exact `combineLatest` / `map` / `switchMap`
  you'd have written, so there's no new runtime model and nothing hidden.
- **Fully typed** — your editor shows real inferred types live
  (`const doubled: RenderObservable<number>`), with no `any` and no false errors on `count * 2`.
- **Incremental** — it's plain RxFM with extra ergonomics, so you can lift a single expression or a
  whole app, and freely mix lifted and hand-written streams.

> Reactive TS is experimental — see [How Reactive TS works](#how-reactive-ts-works) at the end for the mechanics and
> current status.

---

## Components

Components in RxFM are simply `Observable`s emitting `HTMLElement`s. Component names are PascalCase.

### Hello World

```typescript
import { Div, addToView } from 'rxfm';

const HelloWorld = Div('Hello, World!');

addToView(HelloWorld); // mounts to document.body; returns a teardown function
```

`addToView` makes the single subscription your app needs: it appends the element (swapping it if the
component ever re-emits) and returns a function to tear it down. The root should be the only mounted
component — everything else piggybacks on that one subscription.

### Component Children

Children can be strings, other components, functions returning components, or observables:

```typescript
const ChildrenExample = Div(
  'Children can be strings, ',
  B('child components, '),
  () => Span('functions returning components, '),
  'or observables: ',
  timer(0, 1000),
  's elapsed.',
);
```

Tagged-template syntax works too, and observable interpolations are reactive out of the box:

```typescript
const TaggedTemplateExample = Div`We can use ${B`tagged templates!`}`;
```

---

## State & Events

State lives in `BehaviorSubject`s (like React's `useState`, but changes hit the DOM immediately).
Element creators expose fluent `on<Event>` methods (`onClick`, `onInput`, …) for events:

```typescript
import { Div, Button } from 'rxfm';
import { BehaviorSubject } from 'rxjs';

const Counter = () => {
  const clicks = new BehaviorSubject(0);

  const doubled = clicks * 2;   // ⇒ RenderObservable<number>

  return Div(
    Button.onClick(() => clicks.next(clicks.value + 1))`+1`,
    Div`doubled = ${doubled}`,
    Div`${clicks} clicks · doubled ${clicks * 2} · ${clicks > 5 ? 'high' : 'low'}`,
  );
};
```

The derivations are written as plain expressions — `clicks * 2` and the arithmetic / comparison /
ternary inside the template literal all lift in place, with no `combineLatest` or `map`.

The fluent `on<Event>` methods are sugar for the `event` component operator; `Button.onClick(h)` is
equivalent to ``Button`…`.pipe(event.click(h))``. They chain
(`Button.onClick(handleClick).onMouseenter(handleHover)`), and a generic `on(type, handler)` form is
available for dynamic event types.

Components that hold state should be declared as functions (as above) so instances don't share
state.

---

## Attributes & Styling

Styles, CSS classes, and attributes are set with fluent methods on element creators. Static values
need no lifting:

```typescript
const StylesExample = Div.style({ color: 'blue', fontStyle: 'italic' })`We can add styles`;
const ClassExample  = Div.class('example-class')`We can add CSS classes`;
const AttributesExample = Input.type('text').placeholder('Type here')();
```

Values can be observables to make them dynamic — derive them as plain expressions, then pass the
result in:

```typescript
const color = timer(0, 1000) % 2 === 0 ? 'blue' : 'red';   // ⇒ RenderObservable<string>
const DynamicStyles = Div.style({ color })`Styles can be dynamic`;
```

`style`, `class`, and the attribute methods all also have operator forms (``style.color`blue` ``,
``classes`x` ``, ``attribute.id`y` ``) usable via `.pipe`. A generic `attr(name, value)` covers
attributes outside the typed set (`data-*`, `aria-*`, custom attributes).

---

## Conditionally Displaying Components

Derive a boolean stream by expression, and a ternary over it lifts to the same `switchMap` you'd
write by hand — emitting the component when the condition holds and `null` (removed from the DOM)
otherwise:

```typescript
import { Div } from 'rxfm';
import { timer } from 'rxjs';

const flipFlop = timer(0, 1000) % 2 === 0;                    // ⇒ RenderObservable<boolean>
const maybeVisible = flipFlop ? Div`Now you see me!` : null;  // ⇒ RenderObservable<HTMLDivElement | null>

const ConditionalComponentsExample = Div(maybeVisible);
```

> For **arrays**, don't reach for a ternary/`switchMap` per item — components would be recreated on
> every emission. Use `.map` (next section), which lifts to `mapToComponents` and reuses DOM
> elements.

---

## Component Inputs & Outputs

Inputs are function arguments; outputs are callbacks you pass in. Values derived from inputs — like
"is this option the selected one?" — are just expressions:

```typescript
import { Div, Button } from 'rxfm';
import { BehaviorSubject } from 'rxjs';

const options = ['Option 1', 'Option 2', 'Option 3'];

const ComponentIOExample = () => {
  const selectedOption = new BehaviorSubject('Option 1');
  const setOption = (option: string) => selectedOption.next(option);

  const Options = options.map(option =>
    Button
      .onClick(() => setOption(option))
      .class('option-button', selectedOption === option && 'active')
      `${option}`,
  );

  return Div(Options, Div`Current Value: ${selectedOption}`);
};
```

`selectedOption === option` lifts to `RenderObservable<boolean>` — replacing
`selectedOption.pipe(map(s => s === option))` — and is passed straight to `.class` as the active
flag. Note `Options` is handed to `Div` as a **single array**, with no spread.

Children may be passed as a (possibly nested) **array** as well as individually — handy for a mapped
list like `Options` above. A component that forwards a variable number of children typed as
`ComponentChild` can hand them straight on:

```typescript
const Card = (...children: ComponentChild[]) => Div.class('card')(children);
```

---

## Dynamic Component Arrays

Render a list from an array observable, reusing DOM elements across emissions (keyed like React's
`key`). Calling `.map` on an array observable lifts to `mapToComponents`, and the item inside the
callback behaves like an observable so its fields lift in the template:

```typescript
import { Div } from 'rxfm';
import { BehaviorSubject } from 'rxjs';

interface TodoItem { name: string; done: boolean; }

const items = new BehaviorSubject<TodoItem[]>([
  { name: 'Item 1', done: true },
  { name: 'Item 2', done: false },
]);

const ComponentArraysExample = Div(
  items.map(item => Div`${item.name} is ${item.done ? '' : 'not'} done!`, 'name'),
);
```

The second argument (`'name'`) is the id/key — a property name or an id function; omit it to key by
array index. If `items` emits a new array, the list updates in place, reusing existing DOM elements
for items whose id is unchanged.

The plain-RxFM equivalent — a per-item component over `Observable<TodoItem>` passed to
`mapToComponents(Item, 'name')` — is documented in the
[plain-TypeScript reference](plain-typescript.md#dynamic-component-arrays).

---

## How Reactive TS works

Reactive TS is a **checker-driven transform**: it builds a real TypeScript program and asks the type
checker whether each expression touches an observable. If it does, Reactive TS "lifts" the expression into
the equivalent reactive stream — `count * 2` becomes
`combineLatest([count, of(2)]).pipe(map(([c, n]) => c * n))`, a `cond ? a : b` becomes a
`switchMap`, and so on. The result is a `RenderObservable<T>` that behaves exactly like the
hand-written RxJS, which is why the editor can show real inferred types.

**Where lifting happens.** The transform only rewrites in three places, so derivations naturally
live on their own lines rather than buried inside call arguments:

- **variable initializers** — `const doubled = count * 2;`
- **tagged-template interpolations** — ``Div`count = ${count * 2}` ``
- **array `.map` calls** — ``items.map(item => Div`…`, 'id')`` lifts to `mapToComponents`

**Reactive TS vs. the fluent API.** The fluent component methods (`onClick`, `.style`, `.class`,
`Input.type()`) and reactive tagged templates are plain RxFM features that work with or without
Reactive TS. Reactive TS only adds the derived-value ergonomics on top — everything else on this page is ordinary
RxFM.

> **Status.** Reactive TS is a spike. It needs the [Reactive TS transform / editor extension](reactive-ts/), and its
> build-time story is still being worked out (see [reactive-ts/ROADMAP.md](reactive-ts/ROADMAP.md)). For anything
> production-facing today, prefer the plain style in the
> [plain-TypeScript reference](plain-typescript.md).

---

## Advanced Examples

The full Reactive TS example suite — the basics covered on this page plus a todo list, snake game, and
minesweeper — lives in [examples/](../examples/) and powers the
[live demo](https://alden12.github.io/rxfm/) (`yarn dev` to run it locally). A condensed,
single-file Reactive TS showcase is in [reactive-ts/examples/app.rts](../reactive-ts/examples/app.rts). The
plain-TypeScript equivalents are in
[examples/plain-typescript](../examples/plain-typescript/).
