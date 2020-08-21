import { div, p, h2 } from 'rxfm';
import { codeBlock } from '../../layout/code-block';

const idAttributeCode =
`export const componentWithId = div(
  { id: 'suchAttributes' },
  'wow',
);`
;

export const attributesPage = div(
  p(
    `We've seen how to add children to our components, but we'd also like to be able to modify their attributes.`,
    ` Attributes can be passed to a component as the first argument of a component function.`,
    ` To do this we pass an object where keys are attribute names and values are the value we want to provide.`,
  ),
  codeBlock(idAttributeCode, true),
  p(
    `Attribute values can either be static values or observables.`,
    ` Some special attributes such as class and style may take some other types as well.`,
  ),
  h2('Class'),
  p(
    `A class example.`,
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
