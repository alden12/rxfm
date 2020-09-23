import { div, h2, p } from 'rxfm';

export const customCreatorsPage = div(
  p(
    `So far we've seen how to use component creator functions to make various kinds of HTML elements.
    We've had a look at how to give them children, attributes and events.
    But what if we want to make our own component creators which can take the same arguments?
    RxFM provides a function called 'component' which can be used to do just that.`,
  ),
  h2('Component Function'),
  p(
    `The component function is named this for brevity,
    it is actually a function which returns a component creator function.`,
  ),
);
