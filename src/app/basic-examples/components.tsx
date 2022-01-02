import RxFM, { FC } from 'rxfm';
import { timer } from 'rxjs';

export const HelloWorld = <div>Hello, World!</div>;

export const ChildrenExample = () => <div>
  Children can be strings, 
  <b> child components, </b>
  or observables: {timer(0, 1000)}s elapsed.
</div>;

export const CustomJsxElementExample = () => <ChildrenExample />;

interface FunFactsProps {
  name: string;
}

const FunFacts: FC<FunFactsProps> = ({ name, children }) => <div>
  Fun facts about {name}: {children}
</div>;

export const PropsExample = () => <FunFacts name="MC Hammer">
  You can't touch this.
</FunFacts>;
