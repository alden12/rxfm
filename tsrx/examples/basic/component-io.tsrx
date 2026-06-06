// Component inputs and outputs. A parent owns the selected-option state and passes
// an input (the value) and an output (a setter) to each button. `selected === option`
// lifts to a boolean stream, and `active ? 'active' : ''` lifts the class flag — so
// the highlight tracks the selection with no manual `map`.
import { Button, ComponentChild, Div } from 'rxfm';
import { BehaviorSubject, Observable } from 'rxjs';

const Card = (...children: ComponentChild[]) => Div.class('card')(...children);

interface OptionButtonProps {
  option: string;
  setOption: (option: string) => void;
  active: Observable<boolean>;
}

const OptionButton = ({ option, setOption, active }: OptionButtonProps) =>
  Button
    .onClick(() => setOption(option))
    .class('option-button', active && 'active')(
      option,
    );

const options = ['Option 1', 'Option 2', 'Option 3'];

export const ComponentIOExample = () => {
  const selected = new BehaviorSubject<string>('Option 1');
  const setOption = (option: string) => selected.next(option);

  // `options` is a plain array, so this is an ordinary array map producing a list of
  // components — not a reactive `mapToComponents`. `selected === option` is the lift.
  const Options = options.map(option =>
    OptionButton({ option, setOption, active: selected === option }),
  );

  return Card(
    ...Options,
    Div`Current Value: ${selected}`,
  );
};
