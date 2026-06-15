import { BehaviorSubject } from "rxjs";
import { event, events } from "./events";
import { Div } from "./components";
import { Component, ElementType } from "./components/component";

function render<T extends ElementType>(component: Component<T>): T {
  let element!: T;
  component.subscribe(el => { element = el; });
  return element;
}

describe("event", () => {
  it("invokes a handler registered via the proxy property form", () => {
    const handler = jest.fn();
    const element = render(Div("").pipe(event.click(handler)));
    element.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("invokes a handler registered via the generic (type, handler) form", () => {
    const handler = jest.fn();
    const element = render(Div("").pipe(event("click", handler)));
    element.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("passes the event object to the handler", () => {
    let received: Event | undefined;
    const element = render(Div("").pipe(event.click(ev => { received = ev; })));
    const dispatched = new MouseEvent("click");
    element.dispatchEvent(dispatched);
    expect(received).toBe(dispatched);
  });

  it("uses the latest handler emitted by an observable", () => {
    const first = jest.fn();
    const second = jest.fn();
    const handler = new BehaviorSubject<(ev: Event) => void>(first);
    const element = render(Div("").pipe(event.click(handler)));

    element.dispatchEvent(new MouseEvent("click"));
    handler.next(second);
    element.dispatchEvent(new MouseEvent("click"));

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("only fires for the registered event type", () => {
    const handler = jest.fn();
    const element = render(Div("").pipe(event.click(handler)));
    element.dispatchEvent(new MouseEvent("mouseover"));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("events", () => {
  it("registers multiple handlers from a map", () => {
    const onClick = jest.fn();
    const onMouseover = jest.fn();
    const element = render(Div("").pipe(events({ click: onClick, mouseover: onMouseover })));

    element.dispatchEvent(new MouseEvent("click"));
    element.dispatchEvent(new MouseEvent("mouseover"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onMouseover).toHaveBeenCalledTimes(1);
  });
});
