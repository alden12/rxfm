// A real RxFM component written with imperative observable syntax.
//
// `count + count` and `'doubled = ' + doubled` are inferred as observables and
// lifted to RenderObservables under the hood — so they update the DOM reactively
// when `count` changes. Run with:
//   npx vite --config experiments/tsrx/vite.tsrx.config.mjs
import { BehaviorSubject } from 'rxjs';
import { Div, Button, event } from 'rxfm';

const Counter = () => {
  const count = new BehaviorSubject(0);

  // Imperative observable expressions — inferred and lifted to RenderObservables.
  const doubled = count + count;
  const label = 'doubled = ' + doubled;

  return Div(
    Div('count = ', count),
    Div(label),
    Button('increment').pipe(
      event.click(() => count.next(count.value + 1)),
    ),
  );
};

Counter().subscribe(element => document.body.appendChild(element));
