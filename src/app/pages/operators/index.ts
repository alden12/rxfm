import { div, p, h2 } from 'rxfm';
import { expansionContainer, expansion } from '../../layout/expansion';
import { intervalExample } from '../../examples/operators/interval-example';
import { codeBlock } from '../../layout/code-block';

const intervalExampleCode =
`import { interval } from 'rxjs';
import { div } from 'rxfm';

const timePeriod = 1000; // The time period in milliseconds.

const intervalObservable = interval(timePeriod);

export const intervalExample = div('The observable emitted: ', intervalObservable);`
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
    ` For example the interval observable will emit increasing numbers at periodic intervals.`,
    ` We can use RxFM to peek at exactly what it's emitting as in the example below:`,
  ),
  expansionContainer(
    expansion('interval-example.ts')(codeBlock(intervalExampleCode)),
    expansion('Result')(intervalExample),
  ),
  p(
    `An operator is a way for us to modify the values emitted by an observable.`
  ),
);
