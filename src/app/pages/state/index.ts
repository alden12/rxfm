import { div, h2, p } from 'rxfm';
import { clickTimeComponent } from '../../examples/state';

export const statePage = div(
  p(
    `So far we've seen that components can take inputs and emit events,
    but all of our components have been stateless.
    This section explores how managing state for components works in RxFM.
    In the previous section we explored the 'component' function and how it can be used to make our own component creators.
    This function also has a secondary use, it can hold state for us.`,
  ),
  h2('Component State'),
  p(
    `The 'component' function has a secondary overload in which it can hold state for our components.
    To use this overload, all we need to do is provide an initial state as a second argument.`,
  ),
  clickTimeComponent,
);
