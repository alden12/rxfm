// import { addToBody, div, link, addToHead } from 'rxfm';

import { addToView, attribute, ChildComponent, children, classes, div, event, input, span, style, styles } from 'rxfm';
import { BehaviorSubject, EMPTY, interval, Observable, of, timer } from 'rxjs';
import { finalize, map, mapTo, startWith, switchMap, tap } from 'rxjs/operators';
import './styles.css';

document.body.append('Hello World!');

const element = document.createElement('div');
element.append('First component!');
const component = of(element);

const clickCounter = () => {
  const clicks = new BehaviorSubject(0);

  return div('clicks: ', clicks).pipe(
    // style('fontWeight', 'bold'),
    event('click', () => clicks.next(clicks.value + 1)),
    finalize(() => console.log('component removed')),
  );
};

const component2 = (...children: ChildComponent[]) => span(
  'test',
  'more tests',
  // interval(1000).pipe(
  //   switchMap(i => i % 2 ? clickCounter() : of(null))
  // ),
  clickCounter(),
  ...children,
).pipe(
  style('color', interval(1000).pipe(map(i => i % 2 ? 'blue' : null))),
);

const component3 = component2('some more stuff').pipe(
  style('fontWeight', 'bold'),
  style('color', 'green'),
);

const styleTest = div('This should be bold').pipe(
  style('fontWeight', 'bold'),
);

const childrenTest = div().pipe(
  children(interval(1000).pipe(switchMap(i => i % 2 ? div(0, ' bar') : of(null)))),
  children(div(1)),
  children(div(2)),
  children(div(3)),
  children(interval(1600).pipe(switchMap(i => i % 2 ? of(4) : of(null)))),
  // children(timer(1600).pipe(switchMap(i => div(4)))),
);

const classTest = div('text to be styled').pipe(
  classes('first-class', of('second-class')),
  classes(interval(1000).pipe(map(i => i % 2 ? 'second-class' : null)))
);

const stylesTest = div('text with style').pipe(
  styles({
    fontWeight: 'bold',
    padding: '5px',
    color: 'orange',
  }),
  styles(interval(1000).pipe(map(i => i % 2 ? { color: 'green' } : {}))),
  styles({
    padding: interval(1500).pipe(map(i => i % 2 ? '10px' : null)),
  }),
);

const attributesTest = div(
  input().pipe(
    attribute('best'),
    attribute('value', 'hello!'),
    // attribute('value', of('hello!')),
    attribute('best', interval(1000).pipe(map(i => i % 2 ? '' : null))),
    attribute('value', interval(1000).pipe(map(i => i % 2 ? 'world!' : null))),
  ),
);

addToView(component);
addToView(component2());
addToView(component3);
addToView(styleTest);
addToView(classTest);
// addToView(stylesTest);
// addToView(childrenTest);
addToView(div(1, 2, attributesTest));

const example = () => {
  const counter = new BehaviorSubject(0);

  return div('counter: ', counter).pipe(
    event('click', () => counter.next(counter.value + 1))
  );
};

example().subscribe(el => document.body.appendChild(el))
