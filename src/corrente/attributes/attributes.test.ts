import { BehaviorSubject } from 'rxjs';
import { attribute, attributes } from './attributes';
import { Div, Input } from '../components';
import { Component, ElementType } from '../components/component';

function render<T extends ElementType>(component: Component<T>): T {
  let element!: T;
  component.subscribe(el => { element = el; });
  return element;
}

describe('attribute', () => {
  it('sets an individual attribute via the proxy', () => {
    const element = render(Div('').pipe(attribute.id('app')));
    expect(element.getAttribute('id')).toBe('app');
  });

  it('updates an attribute from an observable and removes it on null', () => {
    const title = new BehaviorSubject<string | null>('hello');
    const element = render(Div('').pipe(attribute.title(title)));
    expect(element.getAttribute('title')).toBe('hello');
    title.next(null);
    expect(element.hasAttribute('title')).toBe(false);
  });

  it('renders a boolean attribute as present/absent', () => {
    const disabled = new BehaviorSubject(true);
    const element = render(Input().pipe(attribute('disabled', disabled)));
    expect(element.getAttribute('disabled')).toBe('');
    disabled.next(false);
    expect(element.hasAttribute('disabled')).toBe(false);
  });

  it('writes the value property (not attribute) for inputs', () => {
    const element = render(Input().pipe(attribute('value', 'typed'))) as HTMLInputElement;
    expect(element.value).toBe('typed');
  });

  it('builds an attribute value from a tagged template', () => {
    const name = new BehaviorSubject('world');
    const element = render(Div('').pipe(attribute.title`hello ${name}`));
    expect(element.getAttribute('title')).toBe('hello world');
    name.next('there');
    expect(element.getAttribute('title')).toBe('hello there');
  });
});

describe('attributes', () => {
  it('sets multiple attributes from a static dictionary', () => {
    const element = render(Div('').pipe(attributes({ id: 'app', title: 'hi' })));
    expect(element.getAttribute('id')).toBe('app');
    expect(element.getAttribute('title')).toBe('hi');
  });

  it('sets and diffs attributes from an observable dictionary', () => {
    const dict = new BehaviorSubject<Record<string, string>>({ id: 'app', title: 'hi' });
    const element = render(Div('').pipe(attributes(dict)));
    expect(element.getAttribute('title')).toBe('hi');
    dict.next({ id: 'app' }); // title dropped → removed
    expect(element.hasAttribute('title')).toBe(false);
    expect(element.getAttribute('id')).toBe('app');
  });
});
