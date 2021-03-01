import { component, div, mergeAttributes, h3, span } from 'rxfm';

import './card.css';

const card = (title: string) => component(({ children, attributes }) => div(
  mergeAttributes(attributes, { class: 'card' }),
  h3(title),
  ...children,
));

export const myCard = card('Custom Creator With Inputs')(
  'We can put our content here, ',
  span({ style: { color: 'lightblue' } }, 'which can be whatever we like.'),
);
