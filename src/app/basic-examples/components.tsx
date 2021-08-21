import RxFM from 'rxfm';
import { timer } from 'rxjs';

export const HelloWorld = <div>Hello, World!</div>;

export const ChildrenExample = () => <div>
  Children can be strings, 
  <b>child components, </b>
  or observables: {timer(0, 1000)}s elapsed.
</div>;
