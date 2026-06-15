# Intimidation

### Fixing the big problem with reactive streams

Here's a reactive stream. Quick - what does it do?

```ts
const doubled$ = combineLatest([count$, of(2)]).pipe(map(([c, n]) => c * n));
```

It multiplies a number by two.

That gap - between how simple the idea is and how much machinery it took to express - is the big problem with reactive streams. Not performance. Not capability. **Intimidation.** Streams ask you to learn a vocabulary, read your code backwards, and babysit subscriptions, all to say "this value depends on that one." Most of us took one look and reached for something friendlier.

The friendlier thing won. Signals are everywhere now - Solid, Angular, Vue, the lot. And signals are great. But it's worth being honest about what they are: **reactive streams with the scary parts amputated.** You get the dependency tracking. You lose time. You lose async composition. You lose the operator vocabulary that made streams worth the trouble in the first place. We didn't decide streams were the wrong model - we decided they were too intimidating, and we settled.

What if the intimidation was a bug in the tools, not a property of the idea?

## The idea is actually the easy part

A user interface is a pile of values that change over time. A counter. A selected tab. A list of todos. The mouse position. That *is* a bunch of streams - it's the most honest description of what a UI is.

The reason streams feel hard isn't the model. It's two accidents of how we've used them:

1. **The syntax.** You can't write `count * 2` over a stream; you write the `combineLatest` incantation above.
2. **The architecture.** Every mainstream framework bolts reactivity *onto* a render cycle. So you're forever translating between "my reactive values" and "the framework's re-render," wiring the two together by hand.

Fix both and there's nothing left to be intimidated by. That's the whole bet behind two small experiments: **Corrente** (the framework) and **Reactive TS** (the language layer).

## Layer one: the framework *is* the stream

Corrente has one core idea: **a component is just an `Observable<HTMLElement>`.** An element is reactive because it *is* a stream - there's no virtual DOM, no diffing, no reconciliation, no render scheduling. A single mount at the root sets the whole app in motion, and state changes hit the DOM immediately.

```ts
const Counter = () => {
  const count = new BehaviorSubject(0);
  return Div(
    Button.onClick(() => count.next(count.value + 1))`+1`,
    Div`${count} clicks`,
  );
};

addToView(Counter()); // the only subscription your app needs
```

Notice what's *not* here. No `useState`. No dependency array. No `useCallback` to stop a child re-rendering. No memoization. There's no re-render cycle, so the entire category of bugs that comes with one - stale closures, wasted renders, "why did this run twice" - simply can't occur. The value flows to exactly the piece of DOM that's bound to it, and nothing else moves.

This is the thing other approaches can't quite reach. A render-based framework can get *very* fast at re-running your component and diffing the result - but it's still re-running and diffing. Corrente never has to, because the update path is the stream itself.

## Layer two: streams without the intimidation

That still leaves the syntax problem. `count * 2` over a stream shouldn't require a pipeline. So **Reactive TS** lets you write the plain expression:

```ts
const doubled = count * 2;          // a stream that re-emits whenever count changes
const isActive = selected === tab;  // a boolean stream
const view = visible ? Div`Hi` : null; // swaps the component reactively
```

It's not a runtime trick or a new mental model. Reactive TS reads your types, sees that `count` is a stream, and lifts the expression into the exact RxJS you'd have written by hand - the `combineLatest` from the top of this article, generated for you, fully typed in your editor. You write maths; you get a stream.

Put the two layers together and you get things that ought to be fiddly for free. Here's a real, continuously-running animation - and there's no animation loop in it:

```ts
const tick = timer(0, 50);     // a clock, ticking every 50ms
const hue = (tick * 2) % 360;  // a number, derived with plain maths

const Banner = Div
  .style({ background: `linear-gradient(135deg, hsl(${hue} 85% 55%), hsl(${hue + 60} 85% 60%))` })
  `Reactive by default`;
```

`hue` is a stream because `tick` is, and `(tick * 2) % 360` is just maths over it (layer two). The moment it lands in the style string the element is bound to it and repaints on every tick - no `requestAnimationFrame`, no state, no re-render, because there's no render cycle to drive (layer one). The animation is just the data moving.

## The point

Reactive streams were never the wrong answer. They were the intimidating one, and we built a decade of tooling to avoid them rather than to fix them. Signals are that avoidance, made comfortable.

The alternative is to make streams comfortable instead - approachable syntax *and* a framework that's reactive to its core, so there's no glue and no ceremony left to flinch at. That's Corrente and Reactive TS. The power was always there. We just had to stop being scared of it.
