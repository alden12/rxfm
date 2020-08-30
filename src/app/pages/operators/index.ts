import { div, p, h2, a } from 'rxfm';
import { expansionContainer, expansion } from '../../layout/expansion';
import { codeBlock } from '../../layout/code-block';
import { intervalExample, filteredIntervalExample, mappedIntervalExample } from '../../examples/operators';

const intervalExampleCode =
`import { interval } from 'rxjs';
import { div } from 'rxfm';

const timePeriod = 1000; // The time period in milliseconds.

const intervalObservable = interval(timePeriod);

export const intervalExample = div('The observable emitted: ', intervalObservable);`
;

const filteredExampleCode =
`import { interval } from 'rxjs';
import { div } from 'rxfm';
import { filter } from 'rxjs/operators';

const filteredIntervalObservable = interval(1000).pipe(
  filter(i => i % 2 === 0),
);

export const filteredIntervalExample = div('Even numbers: ', filteredIntervalObservable);`
;

const mappedExampleCode =
`import { interval } from 'rxjs';
import { div } from 'rxfm';
import { map } from 'rxjs/operators';

const mappedIntervalObservable = interval(1000).pipe(
  map(i => i % 2 === 0 ? 'Even' : 'Odd'),
);

export const mappedIntervalExample = div('The number is: ', mappedIntervalObservable);`
;

export const operators = div(
  p(
    `So far we've seen that observables are special types of event emitters.`,
    ` We can use these to trigger actions whenever they emit,`,
    ` for example to update the inner text of a component in RxFM.`,
  ),
  p(
    `Observables are the core part of the RxJS reactive library.`,
    ` However they are not the be all and end all.`,
    ` Operators are perhaps what makes RxJS the most interesting and useful.`,
    ` This page will focus on those, so if you're already familiar with operators in RxJS,`,
    ` then feel free to skip this section and move on to the next!`,
  ),
  h2('What Do They Do?'),
  p(
    `An observable can emit a series of values over time,`,
    ` this series of values is called a 'stream'.`,
    ` For example the interval observable will emit a stream of increasing numbers at a periodic interval.`,
    ` We can use RxFM to peek at exactly what it's emitting in the example below:`,
  ),
  expansionContainer(
    expansion('interval-example.ts')(codeBlock(intervalExampleCode)),
    expansion('Result')(intervalExample),
  ),
  p(
    `You should see an ever increasing number going up every second.`,
  ),
  p(
    `But what if we want to change what an observable is emitting?`,
    ` An operator is a way for us to modify these emissions before we see them.`,
  ),
  h2('Filter'),
  p(
    `Let's say that we only want to see even numbers.`,
    ` What we want to do is to prevent any odd numbers from being emitted.`,
    ` Fortunately for us there's an operator for that.`,
    ` The 'filter' operator will stop any emissions which do not pass a certain criterion.`,
    ` To use an operator we need to use the 'pipe' method on an observable.`,
    ` The pipe method takes any number of operators to modify the stream as we like.`,
    ` The code to do this is as follows:`,
  ), // TODO: Make a while paragraph explaining pipe.
  expansionContainer(
    expansion('filtered-interval-example.ts')(codeBlock(filteredExampleCode)),
    expansion('Result')(filteredIntervalExample),
  ),
  h2('Map'),
  p(
    `Now let's say that we want to display whether or not the number is even.`,
    ` For this, we want to emit either 'Even' or 'Odd' depending on which number was emitted.`,
    ` The 'map' operator can do just this for us.`,
    ` It will take each incoming value and map it to a new value.`,
    ` So to solve our problem we can use the following code:`,
  ),
  expansionContainer(
    expansion('mapped-interval-example.ts')(codeBlock(mappedExampleCode)),
    expansion('Result')(mappedIntervalExample),
  ),
  p(
    `Of course we can also apply both operators if we like!`,
    ` For example if we only wanted to emit multiples of 3,`,
    ` and we also wanted to multiply the outgoing value by 10,`,
    ` we can use the filter operator to remove anything which is not divisible by 3,`,
    ` then multiply the result by 10 using map.`,
  ),
  p(
    `We'll see more examples of operators being used in actual code in the coming articles.`,
    ` This should help to make it clearer why we would want to operate on observables in this way.`
  ),
  h2('Further Reading'),
  p(
    `There are lots of useful operators in RxJS, each with its own special purpose.`,
    ` If you want to read more about them check out the `,
    a({ href: 'https://www.learnrxjs.io/learn-rxjs/operators' }, 'Learn RxJS article'),
    ` on operators.`,
  ),
);
