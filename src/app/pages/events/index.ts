import { div, p, h2 } from 'rxfm';
import { expansionContainer, expansion } from '../../layout/expansion';
import { codeBlock } from '../../layout/code-block';
import { clickExample } from '../../examples/events';

const clickExampleCode =
`import { button } from 'rxfm';
import { tap } from 'rxjs/operators';

export const clickExample = button(
  { click: tap(() => window.alert('You clicked the button!')) },
  'Click Me',
);`;

const emitEventExampleCode = `import { button, EmitEvent } from 'rxfm';
import { map } from 'rxjs/operators';

const emitEventExample = button(
  { click: map(event => new EmitEvent('test', event.timeStamp)) },
  'Emit Event',
);`;

const emitEventOperatorCode = `import { button, emitEvent } from 'rxfm';

const emitEventOperator = button(
  { click: emitEvent('test', event => event.timeStamp) },
  'Emit Event Operator',
);`;

const handleTwiceCode = `import { button, log } from 'rxfm';
import { tap } from 'rxjs/operators';

const handleEventTwice = button(
  { click: [log(), tap(() => window.alert('You clicked the button!'))] },
  'Handled Twice',
);`;

const operatorFormCode = `import { button, event } from 'rxfm';
import { tap } from 'rxjs/operators';

export const eventOperatorForm = button('Click Me').pipe(
  event('click', tap(() => window.alert('You clicked the button!')))
);`;

const customOperatorCode = `import { button, emitEvent } from 'rxfm';
import { mapTo, scan } from 'rxjs/operators';

export const customEventOperator = button(
  {
    click: event => event.pipe(
      mapTo(1),
      scan((counter, i) => counter + i, 0),
      emitEvent('clickCount', counter => counter)
    ),
  },
  'Click Counter'
);`;

export const events = div(
  p(
    `Until now we've seen seen how to create components and to give them children and attributes.
    But we need some way for our components to react to user input and to communicate between each other.`,
  ),
  h2('User Events'),
  p(
    `To handle user events, eg. mouse clicks, we can do this using event attributes.
    These are found in the same place as other component attributes,
    in the first argument of a component function.`
  ),
  p(
    `The value type of these event attributes is an operator function.
    This is a function taking an event observable, processing it as we like,
    and returning a new event observable.`,
  ),
  p(
    `For demonstration purposes we'll use the tap operator from RxJS.
    This operator will call a function each time an event is emitted
    and then pass the event through as if nothing happened.
    In the example below we'll create a window alert each time the click event fires:`
  ),
  expansionContainer(
    expansion('click-example.ts', true)(codeBlock(clickExampleCode)),
    expansion('Result', true)(clickExample),
  ),
  p(
    `As we'll see later on, most operators that we'd want to use here are provided by RxFM.
    So we rarely need to worry about creating our own as we have here.`
  ),
  expansionContainer(
    expansion('Handling Events More Than Once')(
      p(
        `We can also pass an array of operators to perform more than one action for an event:`,
      ),
      codeBlock(handleTwiceCode, true),
      p(
        `The log operator here will console log any events which pass through it.
        The overall result will be that an alert will be triggered and we will log the event in the console.`
      ),
    ),
  ),
  h2('Emitting Events'),
  p(
    `We've seen how user events are handled but how do we emit our own events?
    This is usually handled by built-in operators in RxFM as we'll see in the next sections,
    but to get a better understanding of what's going on we can look a little deeper.
    A user event is handled by an operator function.
    If that operator returns an EmitEvent object it signals to RxFM that it should emit an event.
    The following code will send a custom event of type 'test' with a payload containing the event timestamp into the DOM:`,
  ),
  codeBlock(emitEventExampleCode, true),
  p(
    `We can then capture this event from any of its parent elements.
    The 'emitEvent' operator in RxFM provides a short hand for the above code:`,
  ),
  codeBlock(emitEventOperatorCode, true),
  p(
    `As events always travel from child to parent in RxFM,
    we need a way to make sure we only allow the correct event types to be emitted by a child component.
    This is where TypeScript really comes in handy.
    It will run type checking to make sure we can only provide child components with the appropriate event types for a given situation.`
  ),
  p(
    `As we'll see in the coming state and store sections,
    emitting events is usually handled by specific operators for each purpose.
    The events which are emitted are handled by wrapper functions,
    completing the component communication pipeline.
    If we ever want to handle theses events ourselves, we need to use the operator form as outlined below.`
  ),
  h2('More Information'),
  expansionContainer(
    expansion('Operator Form')(
      p(
        `Almost everything in RxFM is made up of operators, and event handling and emission is no exception.
        The event operator form is not needed to use RxFM but can be useful in certain more advanced situations,
        for example in making custom event handlers.`,
      ),
      p(
        `The first event example from above could be rewritten using the operator form as follows:`,
      ),
      codeBlock(operatorFormCode, true),
      p(
        `Here the event operator takes the type of event to listen to, and an operator function to process it.
        In this case we would create a window alert whenever the button was clicked as before.
        Using event attributes we can only process default element events.
        With the event operator however, we can process any event type,
        giving us a way to handle custom event types.`,
      ),
      p(
        `The event operator also has some other useful overloads.
        It can take an observable directly giving us the option to create an event independently of element events.
        It may also take a function taking the HTML element and returning an observable.
        This can be used to manually listen to and process element events using the RxJS 'fromEvent' function.
        Finally it has an overload which will listen to and map an event to a new event type for us.
        Here it takes three arguments, the event type to listen to, the event type to emit,
        and a function mapping the incoming event payload to the outgoing event.`,
      ),
    ),
    expansion('Custom Operators')(
      p(
        `It may sometimes be useful to define custom operators for handling events.
        For example we may want to chain multiple operators together.
        As you remember from the operators section,
        an operator function is just a function taking an observable and returning another observable.
        So we can easily define an operator in place as follows.`,
      ),
      codeBlock(customOperatorCode, true),
      p(
        `Here we will count the number of times the button has been clicked and emit a
        'clickCount' event with the total number on each click.
        The scan operator used here is similar to the javascript reduce function.
        It takes a function which is called each time the observable emits, and a second argument for a starting value.
        The function takes the previous result of itself (initially the starting value),
        and the value of the emission.
        It will then emit the returned value of the function, and use this the next time the function is called.
        Using this we can count the number of times the button has been clicked.`
      ),
    )
  ),
);
