import { button, log } from 'rxfm';

export const clickExample = button(
  { click: log() },
  'Click Me',
);
