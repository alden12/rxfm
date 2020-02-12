import { of, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { div, children, event, match, stateManager, StateAction } from './rxfm';

const stated = stateManager(
  { color: 'blue' },
  (state, currentState) => {
    state.subscribe(st => console.log('did it work?', st))
    return div().pipe(
      children(
        'hello world!',
      ),
      event('click', map(() => new StateAction({ color: currentState().color === 'blue' ? 'orange' : 'blue' }))),
    )
  }
);

const app = div().pipe(
  children(
    'hello',
    div().pipe(
      event('click'),
      event('click', map(ev => ev.bubbles)),
      event(of({ test: 1 })),
      event(node => fromEvent(node, 'contextmenu').pipe(map(ev => ev.type))),
      event(node => fromEvent(node, 'contextmenu').pipe(map(ev => ev.timeStamp))),
      children('world!'),
    ),
    stated,
  ),
  event('click', map(ev => [ev.target])),
);

app.pipe(
  match(ev => typeof ev === 'string' ? { match: ev } : { noMatch: ev }),
).subscribe(({ node, events, matchingEvents }) => {
  document.body.appendChild(node);
  events.subscribe(console.log);
  matchingEvents.subscribe(ev => console.log('match:', ev));
});
