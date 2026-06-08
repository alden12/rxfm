import { timer, Observable } from "rxjs";
import { interval } from "../runtime";
declare const period: Observable<number>;
const trap = timer(0, period);     // higher-order: timer returns Observable → nested
const clock = interval(period);    // helper: operator-style, flattens → fine
const ms = 1000;
const plain = timer(0, ms);        // plain-number arg → not lifted → fine
