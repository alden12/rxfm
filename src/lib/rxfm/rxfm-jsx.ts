/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { ComponentChild, Component, Styles, StyleObject, ClassType } from "rxfm";
import { Observable } from "rxjs";
import { AttributeObject, attributes, Attributes, AttributeType, classes, HTMLAttributes, styles } from "./attributes";
import { htmlComponentCreator } from "./components";
import { coerceToArray, flatten, PartialRecord, TypeOrObservable } from "./utils";

export interface DefaultProps {
  children?: ComponentChild | (ComponentChild | ComponentChild[])[];
  style?: Styles | Observable<StyleObject>;
  class?: ClassType | ClassType[];
  attributes?: Attributes | Observable<AttributeObject>;
}

declare namespace RxFM {
  namespace JSX {
    interface Element extends Component {}
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicElements extends Record<
      keyof HTMLElementTagNameMap,
      DefaultProps & PartialRecord<keyof HTMLAttributes, TypeOrObservable<AttributeType>>
    > {}
    interface IntrinsicAttributes extends DefaultProps {}
  }
}

export interface FCProps extends Omit<DefaultProps, 'children'> {
  children?: ComponentChild | ComponentChild[];
}

// TODO: Find a way to allow children type to be redefined?
export type FC<T extends Record<string, any> = {}> = (props: FCProps & T) => RxFM.JSX.Element;

function createElement(tagName: keyof HTMLElementTagNameMap, props: DefaultProps, ...children: ComponentChild[]): RxFM.JSX.Element;
function createElement<T>(fc: FC<T>, props: DefaultProps & T, ...children: ComponentChild[]): RxFM.JSX.Element;
function createElement<T = Record<string, never>>(
  tagOrFc: keyof HTMLElementTagNameMap | FC<T>,
  props: DefaultProps & T,
  ...children: (ComponentChild | ComponentChild[])[]
): RxFM.JSX.Element {
  let component: RxFM.JSX.Element;
  
  const filteredProps = { ...props };
  delete filteredProps.style;
  delete filteredProps.class;
  delete filteredProps.attributes;

  if (typeof tagOrFc === 'function') {
    component = tagOrFc({ ...filteredProps, children: flatten<ComponentChild>(children) });
  } else if (typeof tagOrFc === 'string') {
    // TODO: How to detect SVG elements? Have a list of available SVG elements?
    component = htmlComponentCreator(tagOrFc)(...flatten(children)).pipe(
      (Object.keys(filteredProps).length ? attributes(filteredProps) : src => src)
    );
  } else {
    throw new TypeError(`Invalid type passed as JSX tag. Expected string or FC, received: ${typeof tagOrFc}.`);
  }

  return component.pipe(
    (props?.class ? classes(...coerceToArray(props.class)) : src => src),
    (props?.style ? styles(props.style || {}) : src => src),
    (props?.attributes ? attributes(props.attributes) : src => src),
  );
}

const RxFM = { createElement };

export default RxFM;
