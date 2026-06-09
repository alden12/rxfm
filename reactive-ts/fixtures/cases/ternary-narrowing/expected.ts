import { render } from "./runtime";
import { map } from "rxjs/operators";
import { Observable } from 'rxjs';
declare const x: Observable<number | undefined>;
declare const cell: Observable<{ symbol?: string; n: number }>;
const elapsed = render(x.pipe(map(x => x === undefined ? 0 : x + 1)));
const guarded = render(x.pipe(map(x => !x ? 0 : x + 1)));
const size = render(cell.pipe(map(cell => cell.symbol ? '12px' : '14px')));
