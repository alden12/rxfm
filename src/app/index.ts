import {
  addToView,
  attribute,
  attributes,
  ChildComponent,
  children,
  classes,
  DestroySubject,
  div,
  event,
  generate,
  input,
  selectFrom,
  span,
  style,
  styles,
} from 'rxfm';
import { BehaviorSubject, interval, of } from 'rxjs';
import { finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import './styles.css';

const element = document.createElement('div');
element.append('First component!');
const component = of(element);

const clickCounter = () => {
  const clicks = new BehaviorSubject(0);

  // const { takeUntilDestroy, destroyOnFinalize } = useDestroy();
  const destroy = new DestroySubject();

  // const clickCount = clicks.pipe(takeUntilDestroy());
  const clickCount = clicks.pipe(takeUntil(destroy));

  return div('clicks: ', clicks).pipe(
    event('click', () => clicks.next(clicks.value + 1)),
    finalize(() => console.log('component removed')),
    // destroyOnFinalize(),
    finalize(destroy.emitAndComplete),
  );
};

const component2 = (...children: ChildComponent[]) => span(
  'test',
  'more tests',
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
    attribute('best', interval(1000).pipe(map(i => i % 2 ? '' : null))),
    attribute('value', interval(1000).pipe(map(i => i % 2 ? 'world!' : null))),
    attributes({
      foo: 'bar',
      style: { padding: '15px' },
    }),
  ),
);

const generateTest = of([1, 2, 3, 4]).pipe(
  generate(i => div('i: ', i)),
);

const generateDynamic = () => {
  const items = new BehaviorSubject<{ name: string, enabled: boolean }[]>([{ name: '0', enabled: true }]);

  return div(
    items.pipe(
      generate(
        item => div(selectFrom(item, 'name')),
        item => item.name,
      ),
    )
  ).pipe(
    event('click', () => items.next([...items.value, { name: Date.now().toString(), enabled: true }]))
  );
}

addToView(component);
addToView(component2());
addToView(component3);
addToView(styleTest);
addToView(classTest);
addToView(stylesTest);
addToView(childrenTest);
addToView(div(1, 2, attributesTest));
addToView(div(generateTest));
addToView(generateDynamic());

const example = () => {
  const counter = new BehaviorSubject(0);

  return div('counter: ', counter).pipe(
    event('click', () => counter.next(counter.value + 1))
  );
};

example().subscribe(el => document.body.appendChild(el))
