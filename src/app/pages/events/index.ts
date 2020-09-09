import { div, p, h2 } from 'rxfm';
import { expansionContainer, expansion } from '../../layout/expansion';
import { codeBlock } from '../../layout/code-block';
import { clickExample } from '../../examples/events';

const clickExampleCode =
`import { button, log } from 'rxfm';

export const clickExample = button(
  { click: log() },
  'Click Me',
);`;

export const events = div(
  p(
    `Until now we've seen seen how create components and to give them children and attributes.
    But we need some way for our components to react to user input and to communicate between each other.`,
  ),
  h2('User Events'),
  p(
    `To handle user events, eg. mouse clicks, we can do this using event attributes.
    These are found in the same place as other component attributes,
    in the first argument of a component function.`
  ),
  p(
    `The value type of these event attributes is an operator function.
    This is a function taking an event observable, processing it as we like,
    and returning a new event observable.`,
  ),
  p(
    `In the example below we'll use the 'log' operator from RxFM.
    This operator will simply console log the value of the event and do nothing else.`,
  ),
  expansionContainer(
    expansion('click-example.ts')(codeBlock(clickExampleCode)),
    expansion('Result')(clickExample),
  ),
);
