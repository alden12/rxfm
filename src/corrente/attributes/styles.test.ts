import { BehaviorSubject } from 'rxjs';
import { style, styles } from './styles';
import { Div } from '../components';
import { Component, ElementType } from '../components/component';

function render<T extends ElementType>(component: Component<T>): T {
  let element!: T;
  component.subscribe(el => { element = el; });
  return element;
}

describe('style', () => {
  it('sets an individual style via the proxy', () => {
    const element = render(Div('').pipe(style.color('red')));
    expect(element.style.color).toBe('red');
  });

  it('updates a style from an observable', () => {
    const color = new BehaviorSubject('red');
    const element = render(Div('').pipe(style.color(color)));
    expect(element.style.color).toBe('red');
    color.next('blue');
    expect(element.style.color).toBe('blue');
  });

  it('removes a style when the value becomes falsy', () => {
    const color = new BehaviorSubject<string | null>('red');
    const element = render(Div('').pipe(style.color(color)));
    color.next(null);
    expect(element.style.color).toBe('');
  });

  it('builds a style value from a tagged template', () => {
    const width = new BehaviorSubject(10);
    const element = render(Div('').pipe(style.width`${width}px`));
    expect(element.style.width).toBe('10px');
    width.next(20);
    expect(element.style.width).toBe('20px');
  });
});

describe('styles', () => {
  it('sets multiple styles from a static dictionary', () => {
    const element = render(Div('').pipe(styles({ color: 'red', width: '10px' })));
    expect(element.style.color).toBe('red');
    expect(element.style.width).toBe('10px');
  });

  it('sets and diffs styles from an observable dictionary', () => {
    const dict = new BehaviorSubject<{ color?: string; width?: string }>({ color: 'red', width: '10px' });
    const element = render(Div('').pipe(styles(dict)));
    expect(element.style.color).toBe('red');
    dict.next({ color: 'blue' }); // width dropped from the object → removed
    expect(element.style.color).toBe('blue');
    expect(element.style.width).toBe('');
  });
});
