// Attributes, styles, and classes. The static cases use the fluent methods
// (`.style`, `.class`, per-attribute `.type`/`.id`). The dynamic cases are where
// tsrx earns its keep: drive a value off a clock and write the derived expression
// inline — `tick % 2 ? 'red' : 'blue'` lifts in place, no `.pipe(map(...))`.
import { Div, Input } from 'rxfm';
import { interval } from '../runtime';

import './example-styles.css';

// The fluent `style` method is sugar for the `styles` operator.
export const StylesExample = Div.style({
  color: 'blue',
  fontStyle: 'italic',
})`We can add styles`;

const tick = interval(1000);

export const DynamicStyles = Div
  .style({ color: tick % 2 ? 'red' : 'blue' })`Styles can be dynamic`;

// The fluent `class` method is sugar for the `classes` operator.
export const ClassExample = Div.class('example-class')`We can add CSS classes`;

export const DynamicClasses = Div
  .class('example-class', tick % 2 === 1 && 'another-class')`Classes can be dynamic`;

// Per-attribute fluent methods are sugar for the `attribute` operator.
export const AttributesExample = Input
  .type('text')
  .placeholder('We can set element attributes')();

export const DynamicAttributes = Input
  .type('checkbox')
  .checked(tick % 2 === 0)();

export const AttributeExample = Div.id('attribute-example')`We can set individual attributes`;
