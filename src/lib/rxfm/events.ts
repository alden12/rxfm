import { fromEvent } from "rxjs";
import { tap } from "rxjs/operators";
import { componentOperator, ComponentOperator, ElementType } from "./components";

export type ElementEventMap = HTMLElementEventMap & SVGElementEventMap;

export function event<T extends ElementType, E extends keyof ElementEventMap>(
  type: E,
  callback: (event: ElementEventMap[E]) => void,
): ComponentOperator<T> {
  return componentOperator(element => fromEvent(element, type).pipe(
    tap(callback),
  ));
}
