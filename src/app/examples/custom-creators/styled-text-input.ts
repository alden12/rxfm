import { component, input, mergeClasses, mergeStyles } from 'rxfm';

import './styled-text-input.css';

const styledTextInput = component(({ children, attributes }) => input(
  {
    ...attributes,
    type: 'text',
    style: mergeStyles(attributes.style, { margin: '5px' }),
    class: mergeClasses('styled-text-input', attributes.class),
  },
  ...children,
));

export const myStyledTextInput = styledTextInput(
  {
    placeholder: 'Styled Text Input!',
    style: { fontWeight: 'bold' },
    class: 'invert',
  },
);
