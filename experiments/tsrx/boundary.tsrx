// Boundary cases — these lines are INTENTIONAL errors, kept to show tsrx's
// teaching diagnostics. Open this in the editor (with the tsrx extension) to see
// the red squiggles and hover the messages. It is NOT imported by main.ts, so it
// never runs or breaks the build.
import { BehaviorSubject } from 'rxjs';

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
