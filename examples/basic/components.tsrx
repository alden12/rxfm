// Components — the simplest examples. Nothing here lifts (there are no observable
// expressions to derive from), so a .tsrx file reads exactly like the plain rxfm
// form: tsrx only changes things where you'd otherwise reach for `.pipe(...)`.
import { Div, B, Span } from 'rxfm';
import { interval } from '../runtime';

export const HelloWorld = Div('Hello, World!');

export const ChildrenExample = Div(
  'Children can be strings, ',
  B('child components, '),
  () => Span('functions returning components, '),
  'or observables: ',
  interval(1000),
  's elapsed.',
);

export const TaggedTemplateExample = Div`We can use ${B`tagged templates!`}`;
