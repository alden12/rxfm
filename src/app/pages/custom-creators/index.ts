import { div, h2, h3, p } from 'rxfm';
import { expansion, expansionContainer } from '../../layout/expansion';
import { codeBlock } from '../../layout/code-block';
import {
  chips,
  customComponent,
  customComponentAttributes,
  myCard,
  myStyledTextInput,
  myTextInput,
} from '../../examples/custom-creators';

const chipsCode = `import { div } from 'rxfm';

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
);`;

const chipsCss = `.chip {
  border-radius: 15px;
  padding: 8px 12px;
  margin-right: 10px;
  color: white;
}

.chip-list {
  display: flex;
}`;

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

const styledTextInputCode = `import { component, input, mergeAttributes } from 'rxfm';

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
);`;

const styledInputCss = `.styled-text-input {
  border-radius: 5px;
  border: 2px solid black;
  padding: 5px;
  background-color: white;
}

.dark-theme {
  background-color: black;
  color: white;
  border-color: darkgrey;
}`;

const cardCode = `import { component, div, mergeAttributes, h3, span } from 'rxfm';

import './article.css';

const card = (title: string) => component(({ children, attributes }) => div(
  mergeAttributes(attributes, { class: 'card' }),
  h3(title),
  ...children,
));

export const myCard = card('Custom Creator With Inputs')(
  'We can put our content here, ',
  span({ style: { color: 'lightblue' } }, 'which can be whatever we like.'),
);`;

const cardCss = `.card {
  width: 300px;
  border-radius: 10px;
  background-color: #434343cc;
  padding: 15px 10px;
  color: white;
  box-shadow: 3px 3px 5px 0px #00000080;
}

.card h3 {
  margin: 0;
  margin-bottom: 15px;
}`;

export const customCreatorsPage = div(
  p(
    `As we saw in the previous section,
    events are the main way in which components output information.
    To pass information into a component however, all we need to do is create a function
    taking our desired inputs and returning a component.
    The following example shows how we could make a customizable chip (highlighted keyword) component:`,
  ),
  expansionContainer(
    expansion('chips.ts', true)(codeBlock(chipsCode)),
    expansion('chips.css')(codeBlock(chipsCss)),
    expansion('Result', true)(chips),
  ),
  p(
    `We can also pass observables in as arguments to create dynamic components as we'll see in the next sections.`,
  ),
  p(
    `This method allows us to pass in all sorts of customization parameters to our components.
    But what if we want to pass in children or attributes?
    It would be really nice if we could use the same API as we use for the built in components.
    Fortunately this can be done as shown in the next section.`,
  ),
  h2('Custom Creators'),
  p(
    `So far we've seen how to use component creator functions to make various kinds of HTML elements.
    We know that we can give them children, attributes, and handle their events.
    But what if we want to make our own component creators which can take the same kinds of arguments?
    RxFM provides a function called 'component' which can be used to do just that.`,
  ),
  p(
    `The 'component' function is named this for the sake of brevity,
    it is actually a function which returns a component creator function.
    We can use it to make component creators which behave in the same way as the ones
    which we've been importing from RxFM (eg. the 'div' function).`,
  ),
  p(
    `The 'component' function is essentially a wrapper for a component which then gives us an
    easy way to pass children and attributes from outside.
    Inside the component function we should pass a function taking the children and attributes which we want to add,
    and returning the component which we want to create.`,
  ),
  h3('Child Components'),
  p(
    `The example below shows how to make a custom creator which can take child components:`,
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
  h3('Attributes'),
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
    In this case we are simply passing the attributes through to the created component.`,
  ),
  h3('Attribute Merging'),
  p(
    `If we want to define some attributes of the component from inside the custom creator
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
    `Finally, if we're defining some classes or styles inside the custom creator,
    but still want to allow others to be passed in from outside,
    then we need to merge these more intelligently.
    Otherwise they would overwrite each other.
    To do this, there is a utility functions called mergeAttributes provided by RxFM
    which will do the work for us:`,
  ),
  expansionContainer(
    expansion('styled-text-input.ts')(codeBlock(styledTextInputCode)),
    expansion('styled-text-input.css')(codeBlock(styledInputCss)),
    expansion('Result')(myStyledTextInput),
  ),
  p(
    `Again the order in which we pass the attributes in is important,
    we should pass the attributes inside the custom creator last to make sure they take precedence.
    There are also functions called mergeStyles and mergeClasses if you prefer to merge these individually.`
  ),
  h2('Custom Creators With Inputs'),
  p(
    `Finally, we may want to make custom component creators which also take further inputs.
    To do this, we can combine the two syntaxes we've seen above.
    Here, we make a function taking our desired arguments and returning a custom creator.
    This gives us a double bracket syntax where the first set takes our inputs,
    and the second set takes the component children and attributes.
    In the example below we create a generic card component taking a title as an input:`,
  ),
  expansionContainer(
    expansion('card.ts', true)(codeBlock(cardCode)),
    expansion('card.css')(codeBlock(cardCss)),
    expansion('Result', true)(myCard),
  ),
);
