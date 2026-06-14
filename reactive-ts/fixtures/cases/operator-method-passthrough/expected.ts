import { render } from "./runtime";
import { map } from "rxjs/operators";
import { Div } from 'corrente';
import { Observable } from 'rxjs';

declare const nums: Observable<number>;
declare const stop: Observable<unknown>;

// scan: a running fold - passes through verbatim and is render-wrapped (shared),
// not lifted over each emission. The reducer stays inline (its args are plain values).
const total = render(nums.scan((acc, n) => acc + n, 0));
// Deriving over a scan result: `total` is a tracked observable binding, so this lifts.
const doubled = render(total.pipe(map(total => total * 2)));

// The other operators pass through as stream operators too.
const firstThree = render(nums.take(3));
const tail = render(nums.drop(1));
const limited = render(nums.takeUntil(stop));
const debounced = render(nums.debounce(100));
const throttled = render(nums.throttle(50));
const recovered = render(nums.catch(() => nums));
const cleanup = render(nums.finally(() => undefined));

// Chaining: an operator on an operator result - a single render wrap at the binding.
const recent = render(nums.scan((acc, n) => acc + n, 0).takeUntil(stop));

export const View = () => Div`total ${total}, doubled ${doubled}, recent ${recent}`;
