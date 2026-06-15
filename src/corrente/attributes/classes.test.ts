import { BehaviorSubject, of } from "rxjs";
import { classes } from "./classes";
import { Div } from "../components";
import { Component, ElementType } from "../components/component";

/** Subscribe to a component and return its element (kept subscribed for live updates). */
function render<T extends ElementType>(component: Component<T>): T {
  let element!: T;
  component.subscribe(el => { element = el; });
  return element;
}

const classNames = (element: ElementType) => Array.from(element.classList).sort();

describe("classes", () => {
  it("adds static class names", () => {
    const element = render(Div("").pipe(classes("a", "b")));
    expect(classNames(element)).toEqual(["a", "b"]);
  });

  it("splits space-separated class strings", () => {
    const element = render(Div("").pipe(classes("a b")));
    expect(classNames(element)).toEqual(["a", "b"]);
  });

  it("adds class names from an observable, swapping as it emits", () => {
    const className = new BehaviorSubject("a");
    const element = render(Div("").pipe(classes(className)));
    expect(classNames(element)).toEqual(["a"]);
    className.next("b");
    expect(classNames(element)).toEqual(["b"]);
  });

  it("accepts an observable emitting an array of class names", () => {
    const element = render(Div("").pipe(classes(of(["a", "b"]))));
    expect(classNames(element)).toEqual(["a", "b"]);
  });

  it("removes a class when its value becomes falsy", () => {
    const className = new BehaviorSubject<string | null>("a");
    const element = render(Div("").pipe(classes(className)));
    className.next(null);
    expect(classNames(element)).toEqual([]);
  });

  it("does not remove a class still claimed by another operator", () => {
    const dynamic = new BehaviorSubject<string | null>("shared");
    const element = render(Div("").pipe(classes("shared"), classes(dynamic)));
    expect(classNames(element)).toEqual(["shared"]);
    dynamic.next(null); // dynamic operator drops it, but the static operator still holds it
    expect(classNames(element)).toEqual(["shared"]);
  });
});
