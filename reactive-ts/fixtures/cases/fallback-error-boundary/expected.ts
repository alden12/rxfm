import { render } from "./runtime";
import { map } from "rxjs/operators";
import { Observable, of } from "rxjs";
import { fallback, RETRY } from "./runtime";
declare const risky: Observable<number>;
const logged = fallback(risky, (e) => console.error(e));      // return nothing → swallow + complete
const labelled = fallback(risky, () => "There was an error"); // return a value → emit it once
const orNull = fallback(risky, () => null);                   // return null → number | null
const switched = fallback(risky, () => of(0));                // return a stream → switch to it
const robust = fallback(risky, (e, n) => n < 3 ? RETRY : 0);  // retry 3 times, then recover with 0
const doubled = render(logged.pipe(map(logged => logged + 1)));                                    // a derivation over the guarded stream still lifts
