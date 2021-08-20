/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { ComponentChild, Component, Styles, StyleObject, ClassType } from "rxfm";
import { Observable } from "rxjs";
import { AttributeObject, attributes, Attributes, classes, styles } from "./attributes";
import { htmlComponentCreator } from "./components";
import { coerceToArray } from "./utils";

export interface DefaultProps {
  children?: ComponentChild | ComponentChild[];
  style?: Styles | Observable<StyleObject>;
  class?: ClassType | ClassType[];
  attributes?: Attributes | Observable<AttributeObject>;
}

declare namespace RxFM {
  namespace JSX {
    interface IntrinsicElements extends Record<keyof HTMLElementTagNameMap, DefaultProps> {}
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface Element extends Component {}
  }
}

function createElement(tagName: keyof HTMLElementTagNameMap, props: DefaultProps, ...children: ComponentChild[]): RxFM.JSX.Element;
function createElement<T>(fc: FC<T>, props: DefaultProps & T, ...children: ComponentChild[]): RxFM.JSX.Element;
// TODO: Overload for class component?
function createElement<T = Record<string, never>>(
  tagOrFc: keyof HTMLElementTagNameMap | FC<T>,
  props: DefaultProps & T,
  ...children: ComponentChild[]
): RxFM.JSX.Element {
  // TODO: How to detect SVG elements? Have a list of available SVG elements?
  // TODO: How to detect which props should be attributes? Have a list of all attributes?
  const component = typeof tagOrFc === 'function' ? tagOrFc(props) : htmlComponentCreator(tagOrFc)(...coerceToArray(children));
  return component.pipe(
    classes(...coerceToArray(props?.class)),
    styles(props?.style || {}),
    attributes(props?.attributes || {}),
  );
}

const RxFM = { createElement };

export type FC<T extends Record<string, any>> = (props: T & DefaultProps) => RxFM.JSX.Element;

export default RxFM;
