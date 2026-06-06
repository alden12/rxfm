import { Div, B, Span } from 'rxfm';
import { timer } from 'rxjs';

export const HelloWorld = Div('Hello, World!');

export const ChildrenExample = Div(
  'Children can be strings, ',
  B('child components, '),
  () => Span('functions returning components, '),
  'or observables: ',
  timer(0, 1000),
  's elapsed.',
);

export const TaggedTemplateExample = Div`We can use ${B`tagged templates!`}`;
