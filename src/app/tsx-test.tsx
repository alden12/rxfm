import { ClassType, Component, ComponentChild, Div, StyleObject, Styles } from "rxfm";
import { Observable } from "rxjs";
// import JSX from './rxfm-jsx';

const createElement = (tag: string, props: any) => {
  console.log({ tag, props });
  return Div`We created an element!`;
};

const RxFM = { createElement };

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace RxFM {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      foo: { bar: string, children?: ComponentChild | ComponentChild[] };
    }
  
    // eslint-disable-next-line @typescript-eslint/ban-types
    interface ElementAttributesProperty { props: {}; }
  
    // eslint-disable-next-line @typescript-eslint/ban-types
    interface ElementChildrenAttribute { children: {}; }
  
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Element extends Component {}
  }

  interface DefaultProps {
    children?: ComponentChild | ComponentChild[];
    style?: Styles | Observable<StyleObject>;
    class?: ClassType | ClassType[];
  }

  type FC<T> = (props: T & DefaultProps) => RxFM.JSX.Element;
}

const Foo = <foo bar="baz" />;

export const HelloWorld: RxFM.FC<{ hello: string }> = ({ hello }) => <foo bar="test">
  test {Div} {hello}
  {Foo}
</foo>;

export const Test = <HelloWorld hello="world" class="test" style={{ color: "red" }}>test</HelloWorld>;

// Test.subscribe(el => document.body.appendChild(el));
