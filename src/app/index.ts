import { addToView, attribute, button, ChildComponent, div, event, h1, h3, b, styles, classes, input, attributes } from 'rxfm';
import { BehaviorSubject, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import './styles.css';

const helloWorld = div('Hello World');

const childrenExample = div(
  'Children can be strings, ',
  b('child components, '),
  'or observables: ',
  timer(0, 1000),
  's elapsed.',
);

const stylesExample = div('We can add styles').pipe(
  styles({
    color: 'blue',
    fontStyle: 'italic',
  })
);

const dynamicStyles = div('Styles can be dynamic').pipe(
  styles({
    color: timer(0, 1000).pipe(map(i => i % 2 ? 'red' : 'blue')),
  }),
);

const classExample = div('We can add css classes').pipe(
  classes('example-class'),
);

const dynamicClasses = div('Classes can be dynamic').pipe(
  classes(
    'example-class',
    timer(0, 1000).pipe(map(i => i % 2 ? 'another-class' : null)),
  ),
);

const attributesExample = input().pipe(
  attributes({
    type: 'text',
    placeholder: 'We can set element attributes'
  }),
);

const dynamicAttributes = input().pipe(
  attributes({
    type: 'checkbox',
    checked: timer(0, 1000).pipe(map(i => i % 2 === 0))
  })
);

const clickCounter = () => {
  const clicks = new BehaviorSubject(0);

  return button('clicks: ', clicks).pipe(
    event('click', () => clicks.next(clicks.value + 1)),
  );
};

const margin = '10px';

const example = (title: string, ...children: ChildComponent[]) => div(
  h3(title).pipe(styles({ margin: `0 0 ${margin} 0` })),
  ...children,
).pipe(
  styles({
    width: '400px',
    height: '200px',
    border: '1px solid black',
    marginRight: margin,
    marginBottom: margin,
    display: 'flex',
    flexDirection: 'column',
    padding: margin,
    paddingTop: '0',
  }),
);

const examples = () => div(
  example('Hello World', helloWorld),
  example('Children', childrenExample),
  example('Styles', stylesExample),
  example('Dynamic Styles', dynamicStyles),
  example('CSS Classes', classExample),
  example('Dynamic CSS Classes', dynamicClasses),
  example('Attributes', attributesExample),
  example('Dynamic Attributes', dynamicAttributes),
  example('State', clickCounter()),
).pipe(
  styles({
    display: 'flex',
    flexWrap: 'wrap',
  }),
);

const app = div(
  h1('RxFM Examples'),
  examples(),
).pipe(
  attribute('id', 'app'),
  styles({
    marginTop: margin,
    marginLeft: margin,
  }),
);

addToView(app);
