// Conceptually a `.tsrx` file. Imperative use of observables.
// `tsc` would normally reject these — the transform fixes them.
import { Observable } from 'rxjs';

declare const y: Observable<number>;
declare const cond: Observable<boolean>;
declare const fn: Observable<(n: number) => string>;
const z = 1;
const double = (n: number) => n * 2;

// Binary op on an observable → combineLatest + map.
const sum = y + z;

// Plain function over an observable arg → map.
const called = double(y);

// Observable emitting a function, applied to an observable arg →
// combineLatest the fn stream with the arg stream and call it.
const applied = fn(y);

// Ternary on an observable condition → switchMap (lazy) + shareReplay.
const picked = cond ? y : z;
