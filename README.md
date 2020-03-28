# rxfm

Express you apps using nothing else but the awesome power of RxJs. A beautiful, minimalistic framework to natively code the internet in observables. The cleanest reactive framework out there.

```
const app = div().pipe(
  children('Hello, world!'),
);

app.subscribe(({ node }) => document.body.appendChild(node));
```
