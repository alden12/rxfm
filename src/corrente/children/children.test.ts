import { BehaviorSubject, of } from "rxjs";
import { children, lastChildren } from "./children";
import { Div, Span } from "../components";
import { Component, ElementType } from "../components/component";

function render<T extends ElementType>(component: Component<T>): T {
  let element!: T;
  component.subscribe(el => { element = el; });
  return element;
}

describe("children", () => {
  it("adds a string as a text node", () => {
    expect(render(Div().pipe(children("hello"))).textContent).toBe("hello");
  });

  it("coerces a number to text", () => {
    expect(render(Div().pipe(children(5))).textContent).toBe("5");
  });

  it("renders nothing for null/false/undefined children", () => {
    expect(render(Div().pipe(children(null, false, undefined))).childNodes.length).toBe(0);
  });

  it("appends a component child as an element", () => {
    const element = render(Div().pipe(children(Span("x"))));
    expect(element.querySelector("span")?.textContent).toBe("x");
  });

  it("calls a function child to create its component", () => {
    const element = render(Div().pipe(children(() => Span("y"))));
    expect(element.querySelector("span")?.textContent).toBe("y");
  });

  it("updates a text node when an observable child emits", () => {
    const child = new BehaviorSubject("a");
    const element = render(Div().pipe(children(child)));
    expect(element.textContent).toBe("a");
    child.next("b");
    expect(element.textContent).toBe("b");
  });

  it("swaps a text node for an element when an observable child changes type", () => {
    const span = document.createElement("span");
    span.textContent = "e";
    const child = new BehaviorSubject<string | HTMLElement>("text");
    const element = render(Div().pipe(children(child)));
    expect(element.textContent).toBe("text");
    child.next(span);
    expect(element.querySelector("span")).toBe(span);
  });

  it("renders an element array emitted by an observable", () => {
    const spans = [document.createElement("span"), document.createElement("span")];
    spans[0].textContent = "1";
    spans[1].textContent = "2";
    const element = render(Div().pipe(children(of(spans))));
    expect(Array.from(element.children)).toEqual(spans);
  });
});

describe("lastChildren", () => {
  it("places its children after those of the children operator", () => {
    const element = render(Div().pipe(children("a"), lastChildren("b")));
    expect(element.textContent).toBe("ab");
  });
});
