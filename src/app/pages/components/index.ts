import { div, p, h2 } from 'rxfm';
import { codeBlock } from '../../layout/code-block';
import { expansionContainer, expansion } from '../../layout/expansion';
import { counter } from '../../examples/components';

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

const counterCode =
`import { div } from 'rxfm';
import { interval } from 'rxjs';

export const counter = div(
  'You have been reading about components for ',
  interval(1000),
  ' seconds so far!'
);`
;

const blockQuoteCode =
`import { HTML } from 'rxfm;

const quote = HTML.blockquote('Someone said a thing one time probably.')`
;

const counterExpansion = expansionContainer(
  expansion('counter.ts', true)(codeBlock(counterCode)),
  expansion('Result', true)(counter),
);

export const components = div(
  h2('Hello World'),
  p(
    `RxFM is built from reactive elements called 'observables'.`,
    ` These observables can emit all kinds of things whenever we want them to.`,
    ` RxFM works using special observables which emit HTML elements, in a simple wrapper, to display on the screen.`,
    ` We'll refer to these as 'components'.`
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
  h2('Reactive Components'),
  p(
    `To make things a bit more interesting, we can add some more dynamic content to our components.`,
    ` Let's start with a simple counter.`,
    ` We can use the built in 'interval' function in RxJS to give us an observable which emits numbers at the given interval.`,
    ` RxFM components may take observables directly as an input so we can do the following:`
  ),
  counterExpansion,
  p(
    `Later we'll see that we can also do the same thing with child components to dynamically change whatever we want.`,
  ),
  h2('More Information'),
  expansionContainer(
    expansion('Element Types')(
      p(
        `Most common element types are exported directly from RxFM.`,
        ` Some less common elements must be accessed from the HTML type like this:`,
      ),
      codeBlock(blockQuoteCode, true),
      p(
        `This has been done to prevent potential name collisions as HTML has a lot of element names.`
      ),
    )
  )
);
