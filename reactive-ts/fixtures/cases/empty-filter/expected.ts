import { render } from "../runtime";
import { map, switchMap, distinctUntilChanged } from "rxjs/operators";
import { Observable, EMPTY, of, combineLatest } from "rxjs";
declare const score: Observable<number>;
declare const other: Observable<number>;
const big = render(score.pipe(map(score => score > 10)).pipe(distinctUntilChanged(), switchMap(_cond => _cond ? score : EMPTY)));      // filter idiom → maybe-empty
const labelled = render(score.pipe(map(score => score > 5)).pipe(distinctUntilChanged(), switchMap(_cond => _cond ? of("hi") : EMPTY)));   // filter + map → maybe-empty
const safe = render(score.pipe(map(score => score > 10)).pipe(distinctUntilChanged(), switchMap(_cond => _cond ? score : of(0))));         // total ternary → NOT maybe-empty
const stallsHere = render(combineLatest([big, other]).pipe(map(([big, other]) => big + other)));              // combineLatest over maybe-empty + a stream → STALL
const fine = render(combineLatest([safe, other]).pipe(map(([safe, other]) => safe + other)));                   // combineLatest over total → no stall
const collapsed = render(big.pipe(map(big => big + 1)));                   // single-root (D5): one map, no combineLatest → no stall
const childOnly = big;                       // standalone use → no stall
