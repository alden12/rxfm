import { of, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { div, children, event, extractEvent } from './rxfm';
import { stateManager } from './rxfm/state';

const stated = stateManager(
  { color: 'blue' },
  (state, currentState) => {
    return div().pipe(
      children(
        'hello world!',
        state.pipe(
          map(({ color }) => color),
        )
      ),
      event(
        'click',
        map(() => ({
          state: { color: currentState().color === 'blue' ? 'orange' : 'blue' },
        }),
      )),
    )
  }
);

const app = div().pipe(
  children(
    'hello, ',
    div().pipe(
      event('click'),
      event('click', map(({ bubbles }) => ({ bubbles }))),
      event(node => fromEvent(node, 'contextmenu').pipe(map(({ type }) => ({ type })))),
      event(of({ hello: 'world' })),
      event(of({ hello: 1 })),
      children('world!'),
    ),
    stated,
  ),
  event('click', map(({ target }) => ({ target }))),
);

app.pipe(
  extractEvent('click'),
).subscribe(({ node, events, extractedEvents }) => {
  document.body.appendChild(node);
  events.subscribe(console.log);
  extractedEvents.subscribe(ev => console.log('match:', ev));
});
