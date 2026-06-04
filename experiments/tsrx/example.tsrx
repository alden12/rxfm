// A real .tsrx file — open this in the Extension Development Host and hover the
// bindings. `y + z` would be a type error in plain TS; here it's inferred as an
// Observable and lifts to combineLatest + map under the hood.
import { Observable } from 'rxjs';

declare const y: Observable<number>;
const z = 1;

const x = y + z;       // hover ⇒ const x: Observable<number>
const w = x + z;       // hover ⇒ const w: Observable<number>  (propagated)
const doubled = x + x; // hover ⇒ const doubled: Observable<number>
