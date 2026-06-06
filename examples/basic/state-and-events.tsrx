// State and events. State is a BehaviorSubject; the fluent `onClick` pushes to it.
// `clicks * 2` is plain imperative arithmetic that tsrx lifts to a derived stream,
// so the doubled count stays in sync with no `.pipe(map(...))`.
import { Button } from 'rxfm';
import { BehaviorSubject } from 'rxjs';

export const ClickCounter = () => {
  const clicks = new BehaviorSubject(0);
  const doubled = clicks * 2;

  return Button.onClick(() => clicks.next(clicks.value + 1))`Clicks: ${clicks} (doubled: ${doubled})`;
};
