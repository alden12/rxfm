import { render } from "./runtime";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { Div, Input, mapToComponents } from "rxfm";

interface TodoItem {
  name: string;
  done: boolean;
}

declare const items: Observable<TodoItem[]>;
declare function toggle(name: string): void;

// A standalone component function whose item param is an explicitly typed
// `Observable<T>` destructured in place: each field lifts to `item.field`, a handler
// capturing a field lifts as a closure, and an `Observable<T>` param passed at the call
// site flows through verbatim (so this composes with the mapToComponents the `.map` emits).
const TodoItem = (item: Observable<TodoItem>, onToggle: (name: string) => void) =>
  Div
    .onClick(item.pipe(map(item => () => onToggle(item.name))))
    .class("todo-item", render(item.pipe(map(item => item.done ? "done" : ""))))(
      render(item.pipe(map(item => item.name))),
      Input
        .type("checkbox")
        .checked(item.pipe(map(item => item.done))),
    );

export const list = items.pipe(mapToComponents(item => TodoItem(item, toggle), "name"));
