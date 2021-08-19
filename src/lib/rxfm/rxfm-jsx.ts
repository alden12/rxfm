import { Div, ComponentChild, Component, Styles, StyleObject, ClassType } from "rxfm";
import { Observable } from "rxjs";

const createElement = (tag: string, props: any) => {
  console.log({ tag, props });
  return Div`We created an element!`;
};

const RxFM = { createElement };

declare namespace RxFM {
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
}

interface DefaultProps {
  children?: ComponentChild | ComponentChild[];
  style?: Styles | Observable<StyleObject>;
  class?: ClassType | ClassType[];
}

export type FC<T> = (props: T & DefaultProps) => RxFM.JSX.Element;

export default RxFM;
