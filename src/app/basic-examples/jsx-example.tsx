// eslint-disable-next-line @typescript-eslint/no-unused-vars
import RxFM, { FC } from "rxfm";
import { timer } from "rxjs";

const Greet: FC = ({ children }) => <span style={{ color: "blue" }}>Hello {children}!</span>;

const Timer: FC<{ period: number }> = ({ period }) => <span>Time Elapsed: {timer(0, period)}s</span>;

export const JSXExample = <div id="jsx-example">
  <Greet>JSX</Greet>
  <br />
  <Timer period={1000} />
</div>;
