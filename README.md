# RxFM

Express you apps using nothing else but the awesome power of RxJs. A beautiful, minimalistic framework to natively code the internet in observables. The cleanest reactive framework out there.

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
