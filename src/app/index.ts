// import { addToBody, div, link, addToHead } from 'rxfm';

import { addToView, ChildComponent, children, Component, div, ElementType, event, span, style } from 'rxfm';
import { BehaviorSubject, interval, Observable, of, timer } from 'rxjs';
import { distinctUntilChanged, finalize, map, mapTo, startWith, switchMap, tap } from 'rxjs/operators';
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
  style('color', 'red'),
  style('color', 'green'),
);

const childrenTest = div().pipe(
  children(interval(1000).pipe(switchMap(i => i % 2 ? div(0) : of(null)))),
  children(div(1)),
  children(div(2)),
  children(div(3)),
  children(interval(1600).pipe(switchMap(i => i % 2 ? div(4) : of(null)))),
);


addToView(component);
addToView(component2());
addToView(component3);
addToView(childrenTest);
