import { Button, classes, ComponentChild, conditional, Div, event } from "rxfm";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

// const test = classes`card`;

const Card = (...children: ComponentChild[]) => Div(
  ...children,
).pipe(
  classes('card'),
  classes`card`,
);

interface OptionButtonProps {
  option: string;
  setOption: (option: string) => void;
  active: Observable<boolean>;
}

const OptionButton = ({ option, setOption, active }: OptionButtonProps) => Button(option).pipe(
  event('click', () => setOption(option)),
  classes('option-button', conditional(active, 'active')),
);

const options = ['Option 1', 'Option 2', 'Option 3'];

export const ComponentIOExample = () => {
  const selectedOption = new BehaviorSubject<string>('Option 1');
  const setOption = (option: string) => selectedOption.next(option);

  const Options = options.map(option => {
    const active = selectedOption.pipe(map(op => op === option));
    return OptionButton({ option, setOption, active });
  });

  return Card(
    ...Options,
    Div`Current Value: ${selectedOption}`,
  );
};
