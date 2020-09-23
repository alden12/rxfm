import { component, div, mergeStyles } from 'rxfm';

export const childAttributes = component(({ children, attributes }) => div(
  {
    ...attributes,
    id: 'childAttributes',
    style: mergeStyles(attributes.style, { color: 'red' }),
  },
  ...children,
));

export const styledTwice = childAttributes(
  { style: { fontWeight: 'bold' } },
  'Styled Twice',
);
