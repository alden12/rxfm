import { of, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { div, children, event, extractEvent } from './rxfm';

// const stated = stateManager(
//   { color: 'blue' },
//   (state, currentState) => {
//     state.subscribe(st => console.log('did it work?', st))
//     return div().pipe(
//       children(
//         'hello world!',
//       ),
//       event('click', map(() => new StateAction({ color: currentState().color === 'blue' ? 'orange' : 'blue' }))),
//     )
//   }
// );

// interface A {
//   a: number;
// }
// interface B {
//   b: string;
// }
// type AB = { [K in keyof (A & B)]: K extends keyof A ? A[K] : K extends keyof B ? B[K] : never }

// type Merge<T, KE extends string, V> = {
//   [K in keyof (T & Record<KE, V>)]: K extends keyof T ? T[K] : K extends KE ? V : never;
// }
// let a: Merge<A, 'b', string>;
// a.b

const app = div().pipe(
  children(
    'hello, ',
    // 'wow live dev!',
    div().pipe(
      event('click'),
      event('click', map(({ bubbles }) => ({ bubbles }))),
      // event(of({ test: 1 })),
      event(node => fromEvent(node, 'contextmenu').pipe(map(({ type }) => ({ type })))),
      event(of({ hello: 'world' })),
      event(of({ hello: 1 })),
      // map(comp => ),
      // event(node => fromEvent(node, 'contextmenu').pipe(map(ev => ev.timeStamp))),
      // children('world!'),
    ),
    // stated,
  ),
  // event('click', map(({ target }) => ({ target }))),
);

app.pipe(
  // match(ev => typeof ev === 'string' ? { match: ev } : { noMatch: ev }),
  extractEvent('click'),
).subscribe(({ node, events, extractedEvents }) => {
  document.body.appendChild(node);
  events.subscribe(console.log);
  extractedEvents.subscribe(ev => console.log('match:', ev));
});

// function pipe<TS extends any[], R>(...)

// div()
//   (children('test'))
//   (classes('a', 'b'))
//   (event('click', map(ev => ev.clientX)))
// ();

// div()(
//   children('test'),
//   classes('a', 'b'),
//   event('click', map(ev => ev.clientX)),
// );

// div().pipe(
//   children('test'),
//   classes('a', 'b'),
//   event('click', map(ev => ev.clientX)),
// );

// pipe(
//   div,
//   children('test'),
//   classes('a', 'b'),
//   event('click', map(ev => ev.clientX)),
// );

// div(
//   children('test'),
//   classes('a', 'b'),
//   event('click', map(ev => ev.clientX)),
// );

// new Div(
//   children('test'),
//   classes('a', 'b'),
//   event('click', map(ev => ev.clientX)),
// );

// component(div)(
//   children('test'),
//   classes('a', 'b'),
//   event('click', map(ev => ev.clientX)),
// );

// div
//   .children('test')
//   .classes('a', 'b')
//   .event('click', map(ev => ev.clientX))
// ;
