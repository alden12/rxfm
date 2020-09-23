import { Observable, combineLatest, interval } from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';
import { REF_COUNT, div, p } from 'rxfm';

function andGate(...inputs: Observable<boolean>[]): Observable<boolean> {
  return combineLatest(
    inputs.map(ip => ip.pipe(
      distinctUntilChanged(),
    ))
  ).pipe(
    map(ips => ips.every(ip => ip)),
    distinctUntilChanged(),
  );
}

const inputA = interval(1000).pipe(
  map(i => i % 2 === 0),
  shareReplay(REF_COUNT),
);
const inputB = interval(1200).pipe(
  map(i => i % 2 === 0),
  shareReplay(REF_COUNT),
);

const output = andGate(inputA, inputB).pipe(
  shareReplay(REF_COUNT),
);

export const logicGates = div(
  p('input A: ', inputA.pipe(map(en => en ? '1' : '0'))),
  p('input B: ', inputB.pipe(map(en => en ? '1' : '0'))),
  p('output: ', output.pipe(map(en => en ? '1' : '0'))),
);
