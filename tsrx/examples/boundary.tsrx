// Boundary cases — these lines are INTENTIONAL errors, kept to show tsrx's
// teaching diagnostics. Open this in the editor (with the tsrx extension) to see
// the red squiggles and hover the messages. It is NOT imported by main.ts, so it
// never runs or breaks the build.
import { BehaviorSubject, timer } from 'rxjs';
import { interval } from '../runtime';

const count = new BehaviorSubject(0);
const doubled = count * 2; // RenderObservable<number>

// ❌ Calling a reactive value: `doubled` is a stream of numbers, not a function.
//    tsrx leaves this for TypeScript, then rewrites the raw error
//    ("RenderObservable<number> has no call signatures") into a hint to map.
const oops = doubled(1);

// ❌ Same for a value derived through a function call.
const half = (n: number) => n / 2;
const halved = half(count); // RenderObservable<number>
const boom = halved(2);

// ✅ For contrast — *reaching into* a stream is no longer a boundary. These lift
//    automatically (Tier 3), so there are no errors below:
const formatted = doubled.toFixed(2); // → doubled.pipe(map(d => d.toFixed(2)))
const tenth = count / 10;             // → combineLatest([count, of(10)]).pipe(map(...))

// ⚠️ Higher-order lift: `timer` itself RETURNS an observable, so lifting it over an
//    observable period builds Observable<Observable<number>> — a stream of timers
//    that never flattens, so it won't tick as one clock. It type-checks, so tsrx
//    can't leave it to TypeScript; instead it's a tsrx *warning* pointing at the fix.
const ticker = timer(0, count); // ⚠️ stream-of-streams — hover for the warning

// ✅ The fix — `interval` flattens internally (switchMap), so it stays a single
//    Observable<number> and re-times whenever the period changes. No warning.
const clock = interval(count);
