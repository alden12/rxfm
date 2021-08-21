/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { ComponentChild, Component, Styles, StyleObject, ClassType } from "rxfm";
import { Observable } from "rxjs";
import { AttributeObject, attributes, Attributes, AttributeType, classes, HTMLAttributes, styles, SVGAttributes } from "../attributes";
import { htmlComponentCreator, svgComponentCreator } from "../components";
import { coerceToArray, flatten, PartialRecord, TypeOrObservable } from "../utils";
import { svgTagNameMap, SvgTagNames } from "./svg-tag-name-map";

export interface DefaultProps {
  children?: ComponentChild | (ComponentChild | ComponentChild[])[];
  style?: Styles | Observable<StyleObject>;
  class?: ClassType | ClassType[];
  attributes?: Attributes | Observable<AttributeObject>;
}

type IntrinsicHTMLElements = Record<
  keyof HTMLElementTagNameMap,
  DefaultProps & PartialRecord<keyof HTMLAttributes, TypeOrObservable<AttributeType>>
>;

type IntrinsicSVGElements = Record<
  SvgTagNames,
  DefaultProps & PartialRecord<keyof SVGAttributes, TypeOrObservable<AttributeType>>
>;

declare namespace RxFM {
  namespace JSX {
    interface Element extends Component {}
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicAttributes extends DefaultProps {}
    interface IntrinsicElements extends IntrinsicHTMLElements, IntrinsicSVGElements {}
  }
}

export interface FCProps extends Omit<DefaultProps, 'children'> {
  children?: ComponentChild | ComponentChild[];
}

// TODO: Find a way to allow children type to be redefined? Can make this definition work with `keyof T extends 'children'`,
// React seems to fix element children inference by allowing any child type.
export type FC<T = Record<string, any>> = (props: T & FCProps) => RxFM.JSX.Element;

function createElement(
  tagName: keyof HTMLElementTagNameMap | SvgTagNames,
  props: DefaultProps,
  ...children: ComponentChild[]
): RxFM.JSX.Element;
function createElement<T>(fc: FC<T>, props: DefaultProps & T, ...children: ComponentChild[]): RxFM.JSX.Element;
function createElement<T = Record<string, any>>(
  tagOrFc: keyof HTMLElementTagNameMap | SvgTagNames | FC<T>,
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
    if (tagOrFc in svgTagNameMap && !(tagOrFc in {})) {
      component = svgComponentCreator(svgTagNameMap[tagOrFc as SvgTagNames])(...flatten(children)).pipe(
        (Object.keys(filteredProps).length ? attributes(filteredProps) : src => src)
      );
    } else {
      component = htmlComponentCreator(tagOrFc as keyof HTMLElementTagNameMap)(...flatten(children)).pipe(
        (Object.keys(filteredProps).length ? attributes(filteredProps) : src => src)
      );
    }
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
