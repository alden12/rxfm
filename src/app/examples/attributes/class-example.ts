import { div } from 'rxfm';

import './class-example.css';

export const classExample = div(
  { class: ['example-class', 'turn-it-blue'] },
  'Some classy text.'
);
