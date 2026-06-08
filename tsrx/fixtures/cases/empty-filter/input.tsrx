import { Observable, EMPTY } from "rxjs";
declare const score: Observable<number>;
declare const other: Observable<number>;
const big = score > 10 ? score : EMPTY;      // filter idiom → maybe-empty
const labelled = score > 5 ? "hi" : EMPTY;   // filter + map → maybe-empty
const safe = score > 10 ? score : 0;         // total ternary → NOT maybe-empty
const stallsHere = big + other;              // combineLatest over maybe-empty + a stream → STALL
const fine = safe + other;                   // combineLatest over total → no stall
const collapsed = big + 1;                   // single-root (D5): one map, no combineLatest → no stall
const childOnly = big;                       // standalone use → no stall
