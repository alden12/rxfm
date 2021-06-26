import { Div, styles, classes, Input, attributes } from 'rxfm';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

import './example-styles.css';

export const StylesExample = Div`We can add styles`.pipe(
  styles({
    color: 'blue',
    fontStyle: 'italic',
  })
);

export const DynamicStyles = Div`Styles can be dynamic`.pipe(
  styles({
    color: timer(0, 1000).pipe(map(i => i % 2 ? 'red' : 'blue')),
  }),
);

export const ClassExample = Div`We can add CSS classes`.pipe(
  classes('example-class'),
);

export const TaggedTemplateClassExample = Div`We can use the tagged template syntax for classes`.pipe(
  classes`example-class`,
);

export const DynamicClasses = Div`Classes can be dynamic`.pipe(
  classes(
    'example-class',
    timer(0, 1000).pipe(map(i => i % 2 ? 'another-class' : null)),
  ),
);

export const AttributesExample = Input().pipe(
  attributes({
    type: 'text',
    placeholder: 'We can set element attributes'
  }),
);

export const DynamicAttributes = Input().pipe(
  attributes({
    type: 'checkbox',
    checked: timer(0, 1000).pipe(map(i => i % 2 === 0))
  })
);
