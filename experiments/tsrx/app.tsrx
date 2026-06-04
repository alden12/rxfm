// A tsrx showcase. Every derived binding below is written as plain imperative
// code and automatically inferred + lifted to a reactive RenderObservable —
// no `.pipe(map(...))`, no `combineLatest` by hand. Run with:
//   npx vite --config experiments/tsrx/vite.tsrx.config.mjs
//
// Note: lifting happens on variable initializers, so the rendered lines below
// are bound to consts (line1..line4) and then passed to Div.
import { BehaviorSubject } from 'rxjs';
import { Div, Button, event } from 'rxfm';

const Showcase = () => {
  const count = new BehaviorSubject(1);
  const user = new BehaviorSubject<{ name: string; nickname?: string; roles: string[] }>({
    name: 'Ada',
    roles: ['admin', 'editor', 'viewer'],
  });

  // ── Tier 1 — operators: arithmetic, comparison, unary ───────────────────
  const doubled = count * 2;       // arithmetic
  const remainder = count % 3;     // arithmetic
  const isBig = count > 5;         // comparison → boolean stream
  const negated = -count;          // unary

  // ── Tier 2 — lazy ternary / logical ─────────────────────────────────────
  const size = count > 5 ? 'big' : 'small';        // ternary on a comparison
  const display = user.name || 'unknown';          // || (lazy)
  const nick = user.nickname ?? 'no nickname';     // ?? (lazy)

  // ── Tier 3 — member access, method calls, indexing ──────────────────────
  const name = user.name;                  // field extraction
  const ratio = (count / 3).toFixed(2);    // method call on the emitted value
  const firstRole = user.roles[0];         // static index
  const roleAt = user.roles[count % 3];    // dynamic (stream) index

  // ── Template literals — these compose the streams above into display text ─
  const line1 = `count = ${count}  ·  doubled = ${doubled}  ·  -count = ${negated}`;
  const line2 = `count % 3 = ${remainder}  ·  count > 5? ${isBig}  →  it's ${size}`;
  const line3 = `name = ${name}  ·  display = ${display}  ·  nick = ${nick}`;
  const line4 = `(count / 3).toFixed(2) = ${ratio}  ·  roles[0] = ${firstRole}  ·  roles[count % 3] = ${roleAt}`;

  return Div(
    // Tagged-template children with imperative interpolations, lifted in place:
    Div`Hello, ${user.name}! ${count > 5 ? 'High count.' : 'Keep counting.'}`,
    Div(line1),
    Div(line2),
    Div(line3),
    Div(line4),
    Button`count +1`.pipe(
      event.click(() => count.next(count.value + 1)),
    ),
    Button`toggle nickname (${user.nickname ?? 'no nickname'})`.pipe(
      event.click(() => user.next({
        ...user.value,
        nickname: user.value.nickname ? undefined : 'Countess',
      })),
    ),
  );
};

Showcase().subscribe(element => document.body.appendChild(element));
