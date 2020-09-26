import { div, h2, p } from 'rxfm';
import { expansion, expansionContainer } from '../../layout/expansion';
import { codeBlock } from '../../layout/code-block';
import { customComponent, customComponentAttributes, myStyledTextInput, myTextInput } from '../../examples/custom-creators';

const customCreatorCode = `import { component, div } from 'rxfm';

const customCreator = component(({ children }) => div(
  'This is a custom component creator with children: ',
  ...children,
));

export const customComponent = customCreator(
  'Some element children! ',
  'We can pass whatever we want in here.',
);`;

const customCreatorAttributes = `import { component, div } from 'rxfm';

const customCreatorAttributes = component(({ children, attributes }) => div(
  attributes,
  'This custom creator has attributes! ',
  ...children,
));

export const customComponentAttributes = customCreatorAttributes(
  { style: { color: 'blue' } },
  'And children.',
);`;

const textInputCode = `import { component, input } from 'rxfm';

const textInput = component(({ attributes }) => input(
  { ...attributes, type: 'text' },
));

export const myTextInput = textInput(
  { placeholder: 'A Text Input!' },
);`;

const styledTextInputCode = `import { component, input, mergeClasses, mergeStyles } from 'rxfm';

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
);`;

const styledInputCss = `.styled-text-input {
  border-radius: 5px;
  border: 1px solid black;
  padding: 5px;
  background-color: white;
}

.invert {
  background-color: black;
  color: white;
  border-color: darkgrey;
}`;

export const customCreatorsPage = div(
  p(
    `So far we've seen how to use component creator functions to make various kinds of HTML elements.
    We know that we can give them children, attributes, and handle their events.
    But what if we want to make our own component creators which can take the same kinds of arguments?
    RxFM provides a function called 'component' which can be used to do just that.`,
  ),
  // TODO: talk about simple component functions.
  h2('Component Function'),
  p(
    `The component function is named this for the sake of brevity,
    it is actually a function which returns a component creator function.
    We can use it to make component creators which behave in the same way as the ones
    which we've been importing from RxFM (eg. the 'div' function).`,
  ),
  p(
    `The 'component' function is essentially a wrapper for a component which then gives us an
    easy way to pass children and attributes from outside.
    Inside the component function we should pass a function taking the children and attributes which we want to add,
    and returning the component which we want to create.
    The example below shows how to make a custom creator which can take child components:`,
  ),
  expansionContainer(
    expansion('custom-creator.ts', true)(codeBlock(customCreatorCode)),
    expansion('Result', true)(customComponent),
  ),
  p(
    `Here we can see that the customCreator function which we defined can be used in the same way as the
    default component creators which we've been using up until now.
    In this example we are using JavaScript destructuring to access the children argument,
    as well as the spread syntax to put them inside the parent component.`,
  ),
  h2('Attributes'),
  p(
    `We handle custom creator attributes in much the same way.
    They are passed in another argument alongside the component children:`,
  ),
  expansionContainer(
    expansion('custom-creator-attributes.ts', true)(codeBlock(customCreatorAttributes)),
    expansion('Result', true)(customComponentAttributes),
  ),
  p(
    `Here we can see that attributes are applied as we would expect for any other component creator.
    In this case we are simply passing the attributes through to the created component.
    If we want to define some attributes of the component from inside the component creator
    then we need to merge these with those attributes which are passed in from outside:`,
  ),
  expansionContainer(
    expansion('text-input.ts')(codeBlock(textInputCode)),
    expansion('Result')(myTextInput),
  ),
  p(
    `Here we are creating a custom text input component by defining the input type to be 'text' inside the creator,
    then passing other attributes such as placeholder from outside.
    We merge these attributes together using the spread syntax.
    Here it's important to place the attributes passed in from outside before those which we define in the creator.
    This way the attributes defined inside the creator will always take precedence over the incoming ones.`
  ),
  p(
    `Finally if we want to define some styles or classes inside the component creator,
    but still allow others to be passed in, we need to merge these individually.
    To do this, there are utility functions called mergeStyles and mergeClasses provided by RxFM:`,
  ),
  expansionContainer(
    expansion('styled-text-input.ts')(codeBlock(styledTextInputCode)),
    expansion('styled-text-input.css')(codeBlock(styledInputCss)),
    expansion('Result')(myStyledTextInput),
  ),
  p(
    `Again the order in which we pass the styles and classes are important,
    we should pass the styles inside the component creator last to make sure they take precedence.`
  ),
);
