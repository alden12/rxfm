import { Observable } from "rxjs";
import { Component, ElementType } from ".";
import { Div, Button } from "./html";

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

  it('should not affect the plain creator forms', () => {
    const component = Div('plain');
    const { element, unsubscribe } = testComponent(component);
    expect(element).toBeInstanceOf(HTMLDivElement);
    expect(element.firstChild?.textContent).toEqual('plain');
    unsubscribe();
  });
});
