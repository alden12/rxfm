import { render } from "../runtime";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { timer, Observable } from "rxjs";
import { interval } from "../runtime";
declare const period: Observable<number>;
const trap = render(combineLatest([period]).pipe(map(([period]) => timer(0, period))));     // higher-order: timer returns Observable → nested
const clock = interval(period);    // helper: operator-style, flattens → fine
const ms = 1000;
const plain = timer(0, ms);        // plain-number arg → not lifted → fine
