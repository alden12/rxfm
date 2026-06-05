import { Div, classes, Input, attributes, style, attribute } from 'rxfm';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

import './example-styles.css';

// The fluent `style` method is sugar for the `styles` operator.
export const StylesExample = Div.style({
  color: 'blue',
  fontStyle: 'italic',
})`We can add styles`;

export const DynamicStyles = Div`Styles can be dynamic`.pipe(
  style('color', timer(0, 1000).pipe(map(i => i % 2 ? 'red' : 'blue'))),
);

export const StyleExample = Div`We access styles as properties and use tagged templates`.pipe(
  style.color`blue`,
);

// The fluent `class` method is sugar for the `classes` operator.
export const ClassExample = Div.class('example-class')`We can add CSS classes`;

export const TaggedTemplateClassExample = Div`We can use the tagged template syntax for classes`.pipe(
  classes`example-class`,
);

export const DynamicClasses = Div.class(
  'example-class',
  timer(0, 1000).pipe(map(i => i % 2 ? 'another-class' : null)),
)`Classes can be dynamic`;

// Per-attribute fluent methods are sugar for the `attribute` operator.
export const AttributesExample = Input
  .type('text')
  .placeholder('We can set element attributes')();

export const DynamicAttributes = Input().pipe(
  attributes({
    type: 'checkbox',
    checked: timer(0, 1000).pipe(map(i => i % 2 === 0)),
  })
);

export const AttributeExample = Div`We access attributes as properties and use tagged templates`.pipe(
  attribute.id`attribute-example`,
);
