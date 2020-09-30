import { component, input, mergeAttributes } from 'rxfm';

import './styled-text-input.css';

const styledTextInput = component(({ children, attributes }) => input(
  mergeAttributes(attributes, {
    type: 'text',
    style: { margin: '5px' },
    class: 'styled-text-input',
  }),
  ...children,
));

export const myStyledTextInput = styledTextInput(
  {
    placeholder: 'Styled Text Input!',
    style: { fontWeight: 'bold' },
    class: 'dark-theme',
  },
);
