import { Button, event } from 'rxfm';
import { BehaviorSubject } from 'rxjs';

export const ClickCounter = () => {
  const clicks = new BehaviorSubject(0);

  return Button`Clicks: ${clicks}`.pipe(
    event.click(() => clicks.next(clicks.value + 1)),
    // May also be written as: `event('click', () => clicks.next(clicks.value + 1))`,
  );
};
