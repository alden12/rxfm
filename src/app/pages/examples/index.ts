import { div, h2, p } from 'rxfm';
import { todoApp } from '../../examples/todo';
import { logicGates } from '../../examples/logic-gates';

export const examples = div(
  p('Page under construction.'),
  h2('Todo App'),
  todoApp,
  h2('Logic Gates App'),
  logicGates,
);
