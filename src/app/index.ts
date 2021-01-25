// import { addToBody, div, link, addToHead } from 'rxfm';

import { addToView, ChildComponent, Component, div, ElementType, event, span, style } from 'rxfm';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { distinctUntilChanged, map, mapTo, startWith, switchMap, tap } from 'rxjs/operators';
import './styles.css';

document.body.append('Hello World!');

const element = document.createElement('div');
element.append('First component!');
const component = of(element);

const clickCounter = () => {
  const clicks = new BehaviorSubject(0);

  return div('clicks: ', clicks).pipe(
    style('fontWeight', 'bold'),
    event('click', () => clicks.next(clicks.value + 1))
  );
};

const component2 = (...children: ChildComponent[]) => span('test', 'more tests', clickCounter(), ...children).pipe(
  style('color', 'blue'),
);

const component3 = component2('some more stuff').pipe(
  style('color', 'red'),
);

of('value 0').pipe(
  switchMap(val => of('effect 1').pipe(
    tap(console.log),
    mapTo(val),
    startWith(val),
    distinctUntilChanged(),
  )),
  switchMap(val => timer(1000).pipe(
    startWith('effect 2'),
    mapTo('effect 2'),
    distinctUntilChanged(),
    tap(console.log),
    mapTo(val),
    startWith(val),
    distinctUntilChanged(),
  )),
).subscribe(console.log);

// const test = of(1).pipe(
//   tap(() => console.log('First')),
//   startWith(2),
//   tap(() => console.log('Second')),
//   startWith(3),
//   tap(() => console.log('Third')),
//   startWith(4),
//   tap(() => console.log('Fourth')),
// ).subscribe(console.log);

// const x = div('test').pipe(
//     styles({ display: 'flex' }),
//     classes('my-class'),
//     event('click', () => console.log('test'))
// )

// div('test')
//   .styles({ height: '100%' })
//   .classes('my-class')
//   .event('click', () => console.log('test'));

// div(
//   'test',
//   classes('my-class'),
//   styles({ color: 'red' }),
// ).pipe(
//   event('click', () => console.log('test'))
// );

addToView(component);
addToView(component2());
addToView(component3);
