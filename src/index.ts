import { of, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { div, children, event, extractEvent, stateful, stateAction, generate, select } from './rxfm';
import { styles } from './rxfm/attributes/styles';
import { attributes } from './rxfm/attributes';
import { classes } from './rxfm/attributes/classes';

import './index.css';

const stated = stateful(
  {
    color: 'blue',
    items: [0, 1],
  },
  (state, currentState) => {
    return div().pipe(
      styles(state.pipe(map(({ color }) => ({ color })))),
      attributes({ style: 'font-weight: bold' }),
      classes(['italic', 'grey-background']),
      children(
        'hello world!',
        state.pipe(select('color')),
        state.pipe(
          select('items'),
          generate(
            item => item.toString(),
            item => div().pipe(
              children('item: ', item),
              event('click',
                stateAction(() => ({ items: [...currentState().items, currentState().items.length] }))
              ),
            ),
          ),
        )
      ),
      event('click',
        stateAction(() => ({
          color: currentState().color === 'blue' ? 'orange' : 'blue',
        })),
      ),
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
