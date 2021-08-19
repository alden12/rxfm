// eslint-disable-next-line @typescript-eslint/no-unused-vars
import RxFM, { Div, FC } from "rxfm";

const Foo = <foo bar="baz" />;

const HelloWorld: FC<{ hello: string }> = ({ hello }) => <foo bar="test">
  test {Div} {hello}
  {Foo}
</foo>;

export const JSXExample = <HelloWorld hello="world" class="test" style={{ color: "red" }}>test</HelloWorld>;
