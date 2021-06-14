import { Button, classes, ComponentChild, conditional, Div, event } from "rxfm";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

const Card = (...children: ComponentChild[]) => Div(
  ...children,
).pipe(
  classes('card'),
);

const OptionButton = (option: string, setOption: (option: string) => void, active: Observable<boolean>) => {
  return Button(option).pipe(
    event.click(() => setOption(option)),
    classes('option-button', conditional(active, 'active')),
  );
};

const options = ['Option 1', 'Option 2', 'Option 3'];

export const ComponentIOExample = () => {
  const selectedOption = new BehaviorSubject<string>('Option 1');
  const setOption = (option: string) => selectedOption.next(option);

  return Card(
    ...options.map(option => OptionButton(
        option,
        setOption,
        selectedOption.pipe(map(op => op === option))
      ),
    ),
    Div`Current Value: ${selectedOption}`,
  );
};
