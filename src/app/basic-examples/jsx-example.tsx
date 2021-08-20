// eslint-disable-next-line @typescript-eslint/no-unused-vars
import RxFM, { FC } from "rxfm";
import { timer } from "rxjs";

const Greet: FC<{ name: string }> = ({ name }) => <span style={{ color: "blue" }}>Hello {name}!</span>;

const Timer = () => <span>Time Elapsed: {timer(0, 1000)}s</span>;

export const JSXExample = <div>
  <Greet name="JSX" />
  <br />
  <Timer />
</div>;
