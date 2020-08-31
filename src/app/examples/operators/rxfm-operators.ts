import { div, p, styles, children } from 'rxfm';

const normalStyle = p(
  { style: { color: 'blue' } },
  'A regular component!',
)

const operatorStyle = p().pipe(
  styles({ color: 'blue' }),
  children('A component using operators!')
)

export const rxfmOperators = div(
  normalStyle,
  operatorStyle,
);
