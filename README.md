# RxFM (RxJS Framework)

Express your apps using nothing else but the awesome power of [RxJS](https://github.com/ReactiveX/rxjs). A beautiful, minimal framework to natively code the internet in observable streams. The cleanest reactive framework out there.

RxJS allow for expressing data as a stream rather than a single value. This framework extends this philosophy to HTML elements, allowing the internet to be expressed as a stream of time changing elements, instantly reflected in the browser.

Works best with [TypeScript](https://www.typescriptlang.org/).

### Hello World:
Display a simple hello world.
```
const app = div().pipe(
  children('Hello, World!'),
);

addToBody(app);

// Displays: 'Hello, World!'
```

### Components:
A component is simply a function returning a component observable.
```
const counterComponent = () => div().pipe(
  children(interval(1000), 's elapsed!'),
);

const app = div().pipe(
  children(counterComponent()),
);

addToBody(app);

// Displays: '1s elapsed!', '2s elapsed!', ...
```

### Classes & Styling:
Requires webpack [css-loader](https://webpack.js.org/loaders/css-loader/) and [style-loader](https://webpack.js.org/loaders/style-loader/) for css imports.
```
import './classy.css'

const classy = () => div().pipe(
  classes('classy-class'),
  children('Classy text'),
);

const stylish = () => div().pipe(
  styles({ color: red; fontStyle: italic }),
  children('Stylish text'),
);
```

### Events:
Events can be injected into the stream at any point.
```
const clickMe = () => button().pipe(
  children('Click Me!'),
  event(
   'click',
   tap(() => console.log('a click!')),
);

// Logs: 'a click!' on button clicks.
```

### Attributes:
```
const textField = () => input().pipe(
  attributes({ type: 'text' }),
);
```

### State:
Give local state to a component.
```
interface IClickCounterState {
  count: number;
}

const clickCounterStateless = (state: Observable<IClickCounterState>) => button().pipe(
  children(select('count'), ' clicks so far!'),
  event(
    'click',
    mapToLatest(state),
    setState(({ count }) => ({ count: count + 1 })),
  ),
);

const clickCounter = () => stateful({ count: 0 }, clickCounterStateless);

// Displays (as a button): '0 clicks so far!', '1 clicks so far!', ...
```
