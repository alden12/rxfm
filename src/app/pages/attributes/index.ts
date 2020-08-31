import { div, p, h2, a } from 'rxfm';
import { codeBlock } from '../../layout/code-block';
import { expansionContainer, expansion } from '../../layout/expansion';
import { classExample, styleExample } from '../../examples/attributes';

const idAttributeCode =
`export const componentWithId = div(
  { id: 'myFavoriteDiv' },
  'A really great div',
);`
;

const classCode =
`import { div } from 'rxfm';

import './class-example.css';

export const classExample = div(
  { class: ['example-class', 'turn-it-blue'] },
  'Some classy text.'
);`;

const classCss =
`.example-class {
  font-size: 20px;
  font-weight: bold;
  font-style: italic;
}

.turn-it-blue {
  color: blue;
}`;

const styleCode =
`import { div } from 'rxfm';

export const styleExample = div(
  {
    style: {
      color: 'white',
      backgroundColor: 'black',
      padding: '10px',
      borderRadius: '5px',
    },
  },
  'Some stylish text.'
);`;

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
  expansionContainer(
    expansion('class-example.ts')(codeBlock(classCode)),
    expansion('class-example.css')(codeBlock(classCss)),
    expansion('Result')(classExample),
  ),
  p(
    `We're able to import css files as in class-example.ts using the webpack `,
    a({ href: 'https://webpack.js.org/loaders/css-loader/' }, 'css-loader'),
    ' plugin. This is included in the RxFM starter app by default.',
  ),
  h2('Style'),
  p(
    `The style attribute can again take a regular string or string observable.`,
    ` It can also take an object of style names and values as below:`
  ),
  expansionContainer(
    expansion('style-example.ts')(codeBlock(styleCode)),
    expansion('Result')(styleExample),
  ),
  p(
    `Here we can see that style names inside this object are written in camel case.`,
    ` An observable emitting this style object can also be provided to set styles dynamically.`
  ),
);
