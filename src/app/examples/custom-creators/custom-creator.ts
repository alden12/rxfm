import { component, div } from 'rxfm';

const customCreator = component(({ children }) => div(
  'This is a custom component creator with children: ',
  ...children,
));

export const customComponent = customCreator(
  'Some element children! ',
  'We can pass whatever we want in here.',
);
