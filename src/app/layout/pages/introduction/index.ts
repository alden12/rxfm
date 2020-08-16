import { div } from 'rxfm';
import { expansion, expansionContainer } from '../../expansion';
import { codeBlock } from '../../code-block';

const helloWorldCode = codeBlock(
`import { div, addToBody } from 'rxfm';

const helloWorld = div(
  'Hello World!',
);

addToBody(helloWorld);`
);

export const introduction = div(
  'This is the hello world tutorial!',
  expansionContainer(
    expansion('Hello World', true)('Hello World!'),
    expansion('hello-world.ts')(helloWorldCode),
  ),
);
