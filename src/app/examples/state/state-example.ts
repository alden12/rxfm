import { button, component, selectFrom, setState } from 'rxfm'

const initialState = { time: 'Never!' };

const clickTime = component(({ state }) => button(
  {
    click: setState(() => ({ time: new Date().toLocaleTimeString() })),
  },
  'Last Click Time: ',
  selectFrom(state, 'time'),
), initialState);

export const clickTimeComponent = clickTime();
