import { div } from 'rxfm';

import './chips.css';

const chip = (title: string, color: string) => div(
  { class: 'chip', style: { backgroundColor: color } },
  title,
);

export const chips = div(
  { class: 'chip-list' },
  chip('Some', '#e91e63'),
  chip('Cool', '#03a9f4'),
  chip('Chips', '#ff5722'),
);
