import { render } from "./runtime";
import { map } from "rxjs/operators";
import { Observable } from 'rxjs';
import { Div, mapToComponents } from 'rxfm';

interface Cell {
  color: string;
  neighbors: number;
}

declare const board: Observable<Cell[][]>;
declare const COLORS: Record<number, string>;
declare function dispatch(index: number): void;

// `flatMap` over a 2D board: flatten one level, then keyed mapToComponents over the
// flattened cells (so the cb maps each leaf, with its FLAT index — not each row).
// Destructured leaf param + index, exactly like the `.map` component form.
export const cells = board.pipe(map(arr => arr.flat()), mapToComponents((item, index) =>
  Div
    .style({ backgroundColor: render(item.pipe(map(item => item.color))), color: render(item.pipe(map(item => item.neighbors)).pipe(map(neighbors => COLORS[neighbors]))) })
    .onClick(index.pipe(map(index => () => dispatch(index))))
    (render(item.pipe(map(item => item.neighbors)))),
));

// Plain (non-destructured) leaf param also works; `.flat()` is a no-op on an
// already-flat source, so flatMap over a 1-D stream behaves like the `.map` form.
declare const grid: Observable<number[]>;
export const tiles = grid.pipe(map(arr => arr.flat()), mapToComponents(value => Div.class('tile', render(value.pipe(map(value => value > 0 ? 'on' : ''))))()));
