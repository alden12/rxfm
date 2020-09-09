import { div, p, h2 } from 'rxfm';
import { codeBlock } from '../../layout/code-block';
import { expansionContainer, expansion } from '../../layout/expansion';
import { counter, childComponents } from '../../examples/components';

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

const childComponentsCode =
`import { div, h2, p } from 'rxfm';

export const childComponents = div(
  h2('Adding Child Components'),
  p('As you can see, you can add components inside of another component like this!'),
);`;

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
    ` Observables are essentially event emitters which can emit all kinds of things whenever we want them to.`,
    ` RxFM works using special observables which emit HTML elements, in a simple wrapper, to display on the screen.`,
    ` We'll refer to these as 'components'.`,
  ),
  p(
    `To make our components we use component creator functions which we can import from RxFM.`,
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
    ` Everything else gets added as a child element of the root, or of one of its children.`,
  ),
  p(
    `The example belows shows how we can add any number of components as a child of another component:`
  ),
  expansionContainer(
    expansion('child-components.ts')(codeBlock(childComponentsCode)),
    expansion('Result')(childComponents),
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
    ),
    expansion('Subscriptions')(
      `If you've used RxJS before then you may be familiar with the 'subscribe' method on an observable.`,
      ` This is how we get data out of an observable,`,
      ` we register a callback function to handle the data whenever the observable emits.`,
      ` For example:`,
      codeBlock(`div().subscribe(value => console.log(value))`, true),
      `would log an RxFM div element in the console.`,
      ` In RxFM subscription is handled inside the addToBody function.`,
      ` The framework only needs to subscribe to the root element of the application,`,
      ` meaning that we never need to call subscribe directly.`,
    ),
    expansion('Add to View')(
      `The addToBody function is used to add the root element of our application to the document body.`,
      ` However if we want to add our root element in a different place we can use the 'addToView' function`,
      ` This works in the same way as addToBody`,
      ` but also takes the element we would like to add our component to as a second argument. For example: `,
      codeBlock(`addToView(component, document.head)`, true),
      `will add a component to the document head.`,
      ` This is shown as a general example and there is in fact an 'addToHead' function exported from RxFM to do this directly.`
    )
  )
);
