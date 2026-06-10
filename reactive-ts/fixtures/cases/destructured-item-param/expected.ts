import { render } from "./runtime";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { Div, mapToComponents } from "rxfm";
declare const cells: Observable<{ color: string; symbol?: string; neighbors: number; cleared: boolean }[]>;
declare const COLORS: Record<number, string>;
declare function dispatch(index: number): void;
export const list = cells.pipe(mapToComponents((item, index) =>
  Div
    .style({ backgroundColor: render(item.pipe(map(item => item.color))), color: render(item.pipe(map(item => item.neighbors)).pipe(map(neighbors => COLORS[neighbors]))) })
    .class("cell", render(item.pipe(map(item => item.cleared ? "cleared" : ""))))
    .onClick(index.pipe(map(index => () => dispatch(index))))
    (render(item.pipe(map(item => item.cleared && item.neighbors > 0 ? item.neighbors : item.symbol)))),
));
