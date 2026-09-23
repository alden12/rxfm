import { of, Subject } from 'rxjs';
import { componentFunction, componentOperator, sideEffect, Component, ElementType } from './component';
import { Div, Span } from './html';

function render<T extends ElementType>(component: Component<T>): T {
  let element!: T;
  component.subscribe(el => { element = el; });
  return element;
}

describe('componentFunction', () => {
  it('creates a fresh element per subscription (deferred)', () => {
    const create = componentFunction(() => document.createElement('div'));
    const component = create('hi');
    expect(render(component)).not.toBe(render(component)); // defer → new element each time
  });

  it('adds the passed children', () => {
    const create = componentFunction(() => document.createElement('div'));
    expect(render(create('hello')).textContent).toBe('hello');
  });
});

describe('componentOperator', () => {
  it('runs the effect against the element and re-emits the same element', () => {
    const operator = componentOperator<HTMLElement, void>(element => {
      element.setAttribute('data-x', '1');
      return of(undefined);
    });
    const base = Div();
    const baseElement = render(base);
    const operated = render(base.pipe(operator));
    expect(operated.getAttribute('data-x')).toBe('1');
    // The operator is mono-type: it re-emits the element it was given, not a new one.
    expect(operated).toBeInstanceOf(HTMLDivElement);
    expect(baseElement).toBeInstanceOf(HTMLDivElement);
  });
});

describe('sideEffect', () => {
  it('injects an observable and runs its effect without changing the element', () => {
    const source = new Subject<number>();
    const effect = jest.fn();
    const element = render(Div().pipe(sideEffect(source, effect)));
    expect(element).toBeInstanceOf(HTMLDivElement);
    source.next(5);
    expect(effect).toHaveBeenCalledWith(5);
  });

  it('injects an observable with no effect and still emits the element', () => {
    const source = new Subject<number>();
    const element = render(Div().pipe(sideEffect(source)));
    expect(element).toBeInstanceOf(HTMLDivElement);
  });
});

describe('componentCreator', () => {
  it('accepts a static array of children passed directly (without spreading)', () => {
    // A real array of children (not a tagged-template strings array) is now accepted and
    // rendered, so children built elsewhere can be passed as one array.
    const element = render(Div([Span(), Span()]));
    expect(element).toBeInstanceOf(HTMLDivElement);
    expect(element.childNodes.length).toBe(2);
  });
});
