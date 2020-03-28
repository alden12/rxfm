# RxFM

Express you apps using nothing else but the awesome power of RxJs. A beautiful, minimalistic framework to natively code the internet in observables. The cleanest reactive framework out there.

```
const app = div().pipe(
  children('Hello, world!'),
);

addToBody(app);
```

```
const counter = div().pipe(
  children(interval(1000), 'seconds elapsed!'),
);
```
