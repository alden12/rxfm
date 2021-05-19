import { BehaviorSubject, Observable } from "rxjs";
import { Component, ElementType } from ".";
import { Div, Span } from "./html";

const testComponent = <T extends ElementType>(component: Component<T>) => {
  let element: T | undefined = undefined;
  const subscription = component.subscribe(el => { element = el });
  return { element: element!, unsubscribe: () => subscription.unsubscribe() };
};

describe('component', () => {
  it('should return an observable from a component creator function', () => {
    const testComponent = Div();
    expect(testComponent).toBeInstanceOf(Observable);
  });

  it('should emit an HTMLDivElement when a Div component is subscribed', () => {
    const component = Div();
    const { element, unsubscribe } = testComponent(component);
    expect(element).toBeInstanceOf(HTMLDivElement);
    unsubscribe();
  });

  it('should have have a text child with the correct value when text is passed as a component child', () => {
    const textValue = 'hello world!';
    const component = Div(textValue);
    const { element, unsubscribe } = testComponent(component);
    expect(element.firstChild?.textContent).toEqual(textValue);
    unsubscribe();
  });

  it('should reflect the value of an observable when one is passed in as a component child', () => {
    const source = new BehaviorSubject('hello');
    const component = Div(source);
    const { element, unsubscribe } = testComponent(component);
    expect(element.firstChild?.textContent).toEqual('hello');
    source.next('world');
    expect(element.firstChild?.textContent).toEqual('world');
    unsubscribe();
  });

  it('should be possible to add another component as a component child', () => {
    const childComponent = Span();
    const component = Div(childComponent);
    const { element, unsubscribe } = testComponent(component);
    expect(element.firstChild).toBeInstanceOf(HTMLSpanElement);
    unsubscribe();
  });

  it('should be possible to provide component children using tagged templates', () => {
    const component = Div`hello world ${Span}`;
    const { element, unsubscribe } = testComponent(component);
    expect(element.firstChild?.textContent).toEqual('hello world ');
    expect(element.childNodes[1]).toBeInstanceOf(HTMLSpanElement);
    unsubscribe();
  });
});
