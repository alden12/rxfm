import { button, EmitEvent, emitEvent, log } from 'rxfm';
import { map, tap } from 'rxjs/operators';

const emitEventExample = button(
  { click: map(event => new EmitEvent('test', event.timeStamp)) },
  'Emit Event',
);

const emitEventOperator = button(
  { click: emitEvent('test', event => event.timeStamp) },
  'Emit Event Operator',
);

const handleEventTwice = button(
  { click: [log(), tap(() => window.alert('You clicked the button!'))] },
  'Handled Twice',
);
