import { of, fromEvent } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import {
  children,
  event,
  extractEvent,
  stateful,
  stateAction,
  generate,
  select,
  styles,
  attributes,
  classes,
} from '../rxfm';
import {
  div, span,
} from '../rxfm/components';

import './app.css';

const stated = stateful(
  {
    color: 'blue',
    items: [0, 1],
  },
  state => {
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
                stateAction(state,
                  ({ currentState }) => ({ items: [...currentState.items, currentState.items.length] }),
                )
              ),
            ),
          ),
        )
      ),
      event('click',
        stateAction(state,
          ({ currentState }) => ({
            color: currentState.color === 'blue' ? 'red' : 'blue',
          }),
        ),
      ),
    )
  }
);

const app = div().pipe(
  children(
    'hello, ',
    span().pipe(children('span!')),
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

export function main() {
  app.pipe(
    extractEvent('click'),
  ).subscribe(({ node, events, extractedEvents }) => {
    document.body.appendChild(node);
    events.subscribe(console.log);
    extractedEvents.subscribe(ev => console.log('match:', ev));
  });
}

main();
