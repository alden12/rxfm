import { component, input, mergeClasses, mergeStyles } from 'rxfm';

import './styled-text-input.css';

const styledTextInput = component(({ children, attributes }) => input(
  {
    ...attributes,
    type: 'text',
    style: mergeStyles(attributes.style, { margin: '5px' }),
    class: mergeClasses(attributes.class, 'styled-text-input'),
  },
  ...children,
));

export const myStyledTextInput = styledTextInput(
  // ['test', 'text'],
  {
    placeholder: 'Styled Text Input!',
    style: { fontWeight: 'bold' },
    class: 'invert',
  },
);

// type Test = [x: number, y?: string];

// type NonNull = string | number | boolean | object | ((...args: any[]) => (any | void));

// type Is = Test extends [NonNull, ...any[]] ? true : false;
