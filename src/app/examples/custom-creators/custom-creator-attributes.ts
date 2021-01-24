import { component, div } from 'rxfm';

const customCreatorAttributes = component(({ children, attributes }) => div(
  attributes,
  'This custom creator has attributes! ',
  ...children,
));

export const customComponentAttributes = customCreatorAttributes(
  { style: { color: 'blue' } },
  'And children.',
);
