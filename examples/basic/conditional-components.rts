import { Div } from 'rxfm';
import { interval } from '../runtime';

const tick = interval(1000);
const visible = tick % 2 === 0;

export const ConditionalComponentsExample = Div(
  visible ? Div`Now you see me!` : null,
);
