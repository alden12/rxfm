import { render } from "../runtime";
import { map, switchMap } from "rxjs/operators";
// Conceptually a `.rts` file. Imperative use of observables.
// `tsc` would normally reject these — the transform fixes them.
import { Observable, combineLatest, of } from 'rxjs';

declare const y: Observable<number>;
declare const cond: Observable<boolean>;
declare const fn: Observable<(n: number) => string>;
const z = 1;
const double = (n: number) => n * 2;

// Binary op on an observable → combineLatest + map.
const sum = render(y.pipe(map(y => y + z)));

// Plain function over an observable arg → map.
const called = render(y.pipe(map(y => double(y))));

// Observable emitting a function, applied to an observable arg →
// combineLatest the fn stream with the arg stream and call it.
const applied = render(combineLatest([fn, y]).pipe(map(([fn, y]) => fn(y))));

// Ternary on an observable condition → switchMap (lazy) + shareReplay.
const picked = render(cond.pipe(switchMap(cond => cond ? y : of(z))));
