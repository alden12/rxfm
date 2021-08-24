import RxFM, { FC, HTMLElementProps } from "rxfm";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

const Card: FC<HTMLElementProps<'div'>> = props => <div {...props} class="card" />;

interface OptionButtonProps {
  option: string;
  setOption: (option: string) => void;
  active: Observable<boolean>;
}

const OptionButton: FC<OptionButtonProps> = ({ option, setOption, active }) => {
  const classes = active.pipe(
    map(active => ['option-button', active && 'active'])
  );
  
  const handleClick = () => setOption(option);

  return <button class={classes} onClick={handleClick}>{option}</button>;
};

const options = ['Option 1', 'Option 2', 'Option 3'];

export const ComponentIOExample = () => {
  const selectedOption = new BehaviorSubject<string>('Option 1');
  const setOption = (option: string) => selectedOption.next(option);

  const Options = options.map(option => {
    const active = selectedOption.pipe(map(selectedOpt => selectedOpt === option));
    return <OptionButton option={option} setOption={setOption} active={active} />;
  });

  return <Card>
    {Options}
    <div>Current Value: {selectedOption}</div>
  </Card>;
};
