// Conditional components. The original showed two forms — a manual
// `switchMap(visible => visible ? Div`…` : of(null))` and the `conditional` helper.
// In tsrx both collapse to the natural ternary: a component branch makes it lift
// lazily (switchMap under the hood, subscribing only the taken branch). The empty
// branch is `null` (not EMPTY) so rxfm clears the element when the condition flips.
import { Div } from 'rxfm';
import { interval } from '../runtime';

const tick = interval(1000);
const visible = tick % 2 === 0;

export const ConditionalComponentsExample = Div(
  visible ? Div`Now you see me!` : null,
);
