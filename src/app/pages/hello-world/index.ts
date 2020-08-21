import { div, p } from 'rxfm';
import { codeBlock } from '../../layout/code-block';

const divExample =
`import { div } from 'rxfm';

const myFirstComponent = div();`
;

const divWithContent =
`const helloWorld = div('Hello World!');`
;

const helloWorldCode =
`import { div, addToBody } from 'rxfm';

const helloWorld = div('Hello World!');

addToBody(helloWorld);`
;

export const helloWorld = div(
  p(
    `RxFM is built from reactive elements called 'Observables'.`,
    ` These observables can emit all kinds of things whenever we want them to.`,
    ` RxFM works using special observables which emit HTML elements (in a simple wrapper) to display on the screen.`,
    ` We'll refer to these as 'Components'.`
  ),
  p(
    `We create components using functions.`,
    ` For example, we can create a really simple HTML div (generic container) element like this:`
  ),
  codeBlock(divExample, true),
  p(
    `If we want to add something inside the div element, we can simply provide it inside the function brackets.`,
    ` To add 'Hello World!' inside our div we would do it as follows:`,
  ),
  codeBlock(divWithContent, true),
  p(
    `Finally to actually display our component on the page we use the 'addToBody' function,`,
    ` giving us the following overall code:`
  ),
  codeBlock(helloWorldCode, true),
  p(
    `We only use the addToBody function once in our application on the root component.`,
    ` Everything else gets added as a child element of the root, or of one of its children.`
  ),
);
