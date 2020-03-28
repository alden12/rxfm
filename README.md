# RxFM

Express your apps using nothing else but the awesome power of RxJs. A beautiful, minimalistic framework to natively code the internet in observables. The cleanest reactive framework out there.

 ### Hello World:
```
const app = div().pipe(
  children('Hello, World!'),
);

addToBody(app);

// Displays: 'Hello, World!'
```

 ### Simple component:
```
const counter = () => div().pipe(
  children(interval(1000), 's elapsed!'),
);

const app = div().pipe(
  children(counter()),
);

addToBody(app);

// Displays: '1s elapsed!', '2s elapsed!', ...
```

### Classes & Styling:
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
```
const clickMe = () => button().pipe(
  children('Click Me!'),
  event(
   'click',
   map(() => 'a click!'),
   tap(console.log)),
);

// Logs: 'a click!' on button clicks.
```

### State:
```
interface IClickCounter {
  count: number;
}

const clickCounterInitialState: IClickCounter = { count: 0 };

const clickCounterStateless = (state: Observable<IClickCounter>) => button().pipe(
  children(select('count'), ' clicks so far!'),
  event(
    'click',
    mapToLatest(state),
    setState(({ count }) => ({ count: count + 1 })),
  ),
);

const clickCounter = () => stateful(clickCounterInitialState, clickCounterStateless);

// Displays: '0 clicks so far!', '1 clicks so far!', ...
```
