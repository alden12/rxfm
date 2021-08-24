import RxFM from 'rxfm';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

import './example-styles.css';

export const StylesExample = () => <div style={{ color: "blue", fontStyle: "italic" }}>
  We can add styles
</div>;

const color = timer(0, 1000).pipe(map(i => i % 2 ? 'red' : 'blue'));
export const DynamicStyles = () => <div style={{ color }}>Styles can be dynamic</div>;

export const ClassExample = () => <div class="example-class">We can add CSS classes</div>;

const anotherClass = timer(0, 1000).pipe(map(i => i % 2 ? 'another-class' : null));
export const DynamicClasses = () => <div class={['example-class', anotherClass]}>Classes can be dynamic</div>;

export const AttributesExample = () => <input type="text" placeholder="We can set element attributes" />;

const checked = timer(0, 1000).pipe(map(i => i % 2 === 0));
export const DynamicAttributes = () => <input type="checkbox" checked={checked}  />;
