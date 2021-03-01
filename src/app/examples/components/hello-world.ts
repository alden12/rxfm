import { div, addToBody } from 'rxfm';

const helloWorld = div(
  'Hello World!',
);

addToBody(helloWorld);
