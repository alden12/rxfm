import { div, p, h2 } from 'rxfm';
import { codeBlock } from '../../layout/code-block';

const idAttributeCode =
`export const componentWithId = div(
  { id: 'myFavoriteDiv' },
  'A really great div',
);`
;

export const attributesPage = div(
  p(
    `We've seen how to add children to our components, but we'd also like to be able to modify their attributes.`,
    ` Attributes can be passed to a component as the first argument of a component function.`,
    ` To do this we pass an object where keys are attribute names and values are the value we want to provide.`,
    ` To set the id of a div element to 'myFavoriteDiv' we can do it like this:`
  ),
  codeBlock(idAttributeCode, true),
  p(
    `Attribute values can either be static values or observables.`,
    ` Some special attributes such as class and style may take some other types as well.`,
  ),
  h2('Class'),
  p(
    `The class attribute can take a string or a string observable just like all the other attributes.`,
    ` We may want to pass more than one class to an element however.`,
    ` For this we can also pass an array of strings or string observables like this:`,
  ),
  h2('Style'),
  p(
    `A style example.`,
  ),
  h2('Text Input'),
  p(
    `A text input example.`,
  ),
);
