import RxFM, { FC } from "rxfm";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

interface OptionButtonProps {
  option: string;
  setOption: (option: string) => void;
  active: Observable<boolean>;
}

const OptionButton: FC<OptionButtonProps> = ({ option, setOption, active }) => {
  const handleClick = () => setOption(option);

  const activeClassName = active.pipe(
    map(active => active && 'active')
  );

  return <button onClick={handleClick} class={['option-button', activeClassName]}>
    {option}
  </button>;
};

const options = ['Option 1', 'Option 2', 'Option 3'];

export const ComponentOutputsExample = () => {
  const selectedOption = new BehaviorSubject<string>('Option 1');
  const setOption = (option: string) => selectedOption.next(option);

  const optionButtons = options.map(option => {
    const active = selectedOption.pipe(
      map(selectedOpt => selectedOpt === option),
    );

    return <OptionButton option={option} setOption={setOption} active={active} />;
  });

  return <div>
    {optionButtons}
    <div>Current Value: {selectedOption}</div>
  </div>;
};
