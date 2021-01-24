import { component, input } from 'rxfm';

const textInput = component(({ attributes }) => input(
  { ...attributes, type: 'text' },
));

export const myTextInput = textInput(
  { placeholder: 'A Text Input!' },
);
