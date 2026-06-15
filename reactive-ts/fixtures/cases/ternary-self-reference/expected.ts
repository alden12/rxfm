import { render } from "./runtime";
import { switchMap, distinctUntilChanged } from "rxjs/operators";
import { Observable, EMPTY, of } from 'rxjs';

declare const flag: Observable<boolean>;
declare const other: Observable<string>;

// Self-referential: the true branch IS the condition identifier, so in the switchMap
// body it's the current value (the param shadows the outer stream), not a stream to
// switch to — re-emitted as of(flag) so it's a valid ObservableInput.
const selfRef = render(flag.pipe(distinctUntilChanged(), switchMap(flag => flag ? of(flag) : EMPTY)));

// An external observable branch stays a genuine stream to switch to (left verbatim).
const external = render(flag.pipe(distinctUntilChanged(), switchMap(flag => flag ? other : EMPTY)));
