import { div } from 'rxfm';
import { expansion, expansionContainer } from '../../layout/expansion';
import { codeBlock } from '../../layout/code-block';

const helloWorldCode = codeBlock(
`import { div, addToBody } from 'rxfm';

const helloWorld = div(
  'Hello World!',
);

addToBody(helloWorld);`
);

export const helloWorld = div(
  'This is the hello world tutorial!',
  expansionContainer(
    expansion('Hello World', true)('Hello World!'),
    expansion('hello-world.ts', true)(helloWorldCode),
  ),
);
