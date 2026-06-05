import { Button } from "rxfm";
import { BehaviorSubject } from "rxjs";

export const ClickCounter = () => {
  const clicks = new BehaviorSubject(0);

  // Fluent event methods (`onClick`, `onInput`, …) are sugar for the equivalent `event` operator.
  return Button.onClick(() => clicks.next(clicks.value + 1))`Clicks: ${clicks}`;
  // Equivalent to:
  //   Button`Clicks: ${clicks}`.pipe(event.click(() => clicks.next(clicks.value + 1)))
  // The generic form `Button.on('click', handler)` is also available.
};
