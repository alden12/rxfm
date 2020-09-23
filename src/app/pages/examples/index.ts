import { div, h2 } from 'rxfm';
import { todoApp } from '../../examples/todo';
import { logicGates } from '../../examples/logic-gates';

export const examples = div(
  h2('Todo App'),
  todoApp,
  h2('Logic Gates App'),
  logicGates,
);
