import { button, EmitEvent, emitEvent, log } from 'rxfm';
import { map } from 'rxjs/operators';

const emitEventExample = button(
  { click: map(event => new EmitEvent('test', event.timeStamp)) },
  'Emit Event',
);

const emitEventOperator = button(
  { click: emitEvent('test', event => event.timeStamp) },
  'Emit Event Operator',
);

const handleEventTwice = button(
  { click: [log(), emitEvent('test', event => event.timeStamp)] },
  'Handled Twice',
);
