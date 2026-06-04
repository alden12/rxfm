import { combineLatest, of } from "rxjs";
import { map } from "rxjs/operators";
// Conceptually a `.tsrx` file. Imperative use of observables.
// `tsc` would normally reject `y + z` (Observable + number) — the transform fixes that.
import { Observable } from 'rxjs';

declare const y: Observable<number>;
const z = 1;

// Imperative use of an observable → should compile to combineLatest + map.
const x = combineLatest([y, of(z)]).pipe(map(([y, z]) => y + z));

// Propagation: `x` is now an observable, so this should lift too.
const w = combineLatest([x, of(z)]).pipe(map(([x, z]) => x + z));
