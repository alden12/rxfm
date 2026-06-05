import { BehaviorSubject, Observable } from "rxjs";
import { Component, ElementType } from ".";
import { Div, Button, Input } from "./html";

const testComponent = <T extends ElementType>(component: Component<T>) => {
  let element: T | undefined = undefined;
  const subscription = component.subscribe(el => { element = el });
  return { element: element!, unsubscribe: () => subscription.unsubscribe() };
};

describe('chainable creator', () => {
  it('should return an observable when a fluent event method is used with children', () => {
    const component = Div.onClick(() => {})`hello`;
    expect(component).toBeInstanceOf(Observable);
  });

  it('should keep the tagged template children when a fluent event method is used', () => {
    const component = Div.onClick(() => {})`+1`;
    const { element, unsubscribe } = testComponent(component);
    expect(element).toBeInstanceOf(HTMLDivElement);
    expect(element.firstChild?.textContent).toEqual('+1');
    unsubscribe();
  });

  it('should invoke the handler with the event when the event fires', () => {
    let received: Event | undefined;
    const component = Button.onClick(ev => { received = ev; })`click me`;
    const { element, unsubscribe } = testComponent(component);
    const clickEvent = new MouseEvent('click');
    element.dispatchEvent(clickEvent);
    expect(received).toBe(clickEvent);
    unsubscribe();
  });

  it('should support the generic on(type, handler) form', () => {
    let received: Event | undefined;
    const component = Div.on('click', ev => { received = ev; })`x`;
    const { element, unsubscribe } = testComponent(component);
    const clickEvent = new MouseEvent('click');
    element.dispatchEvent(clickEvent);
    expect(received).toBe(clickEvent);
    unsubscribe();
  });

  it('should register every handler when event methods are chained', () => {
    let clicked = false;
    let entered = false;
    const component = Div
      .onClick(() => { clicked = true; })
      .onMouseenter(() => { entered = true; })`x`;
    const { element, unsubscribe } = testComponent(component);
    element.dispatchEvent(new MouseEvent('click'));
    element.dispatchEvent(new MouseEvent('mouseenter'));
    expect(clicked).toBe(true);
    expect(entered).toBe(true);
    unsubscribe();
  });

  it('should produce a childless element when terminated with an empty call', () => {
    let clicked = false;
    const component = Div.onClick(() => { clicked = true; })();
    const { element, unsubscribe } = testComponent(component);
    expect(element).toBeInstanceOf(HTMLDivElement);
    expect(element.childNodes.length).toEqual(0);
    element.dispatchEvent(new MouseEvent('click'));
    expect(clicked).toBe(true);
    unsubscribe();
  });

  it('should apply CSS classes via the class method', () => {
    const component = Div.class('one', 'two')`x`;
    const { element, unsubscribe } = testComponent(component);
    expect(element.classList.contains('one')).toBe(true);
    expect(element.classList.contains('two')).toBe(true);
    unsubscribe();
  });

  it('should reflect a dynamic class from an observable', () => {
    const active = new BehaviorSubject<string | null>('active');
    const component = Div.class('base', active)`x`;
    const { element, unsubscribe } = testComponent(component);
    expect(element.classList.contains('base')).toBe(true);
    expect(element.classList.contains('active')).toBe(true);
    active.next(null);
    expect(element.classList.contains('active')).toBe(false);
    expect(element.classList.contains('base')).toBe(true);
    unsubscribe();
  });

  it('should chain class with event methods', () => {
    let clicked = false;
    const component = Div
      .onClick(() => { clicked = true; })
      .class('btn')`x`;
    const { element, unsubscribe } = testComponent(component);
    expect(element.classList.contains('btn')).toBe(true);
    element.dispatchEvent(new MouseEvent('click'));
    expect(clicked).toBe(true);
    unsubscribe();
  });

  it('should apply styles via the style method', () => {
    const component = Div.style({ color: 'blue', fontStyle: 'italic' })`x`;
    const { element, unsubscribe } = testComponent(component);
    expect(element.style.color).toEqual('blue');
    expect(element.style.fontStyle).toEqual('italic');
    unsubscribe();
  });

  it('should set an attribute via a per-attribute method', () => {
    const component = Input.type('text')`x`;
    const { element, unsubscribe } = testComponent(component);
    expect(element.getAttribute('type')).toEqual('text');
    unsubscribe();
  });

  it('should reflect a dynamic attribute from an observable', () => {
    const placeholder = new BehaviorSubject('first');
    const component = Input.placeholder(placeholder)`x`;
    const { element, unsubscribe } = testComponent(component);
    expect(element.getAttribute('placeholder')).toEqual('first');
    placeholder.next('second');
    expect(element.getAttribute('placeholder')).toEqual('second');
    unsubscribe();
  });

  it('should chain attribute, style, class and event methods together', () => {
    let clicked = false;
    const component = Input
      .type('text')
      .class('field')
      .style({ color: 'red' })
      .onClick(() => { clicked = true; })`x`;
    const { element, unsubscribe } = testComponent(component);
    expect(element.getAttribute('type')).toEqual('text');
    expect(element.classList.contains('field')).toBe(true);
    expect(element.style.color).toEqual('red');
    element.dispatchEvent(new MouseEvent('click'));
    expect(clicked).toBe(true);
    unsubscribe();
  });

  it('should not affect the plain creator forms', () => {
    const component = Div('plain');
    const { element, unsubscribe } = testComponent(component);
    expect(element).toBeInstanceOf(HTMLDivElement);
    expect(element.firstChild?.textContent).toEqual('plain');
    unsubscribe();
  });
});
