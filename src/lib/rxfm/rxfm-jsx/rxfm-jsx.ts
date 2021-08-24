/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { ComponentChild, Component, Styles, StyleObject, ClassType } from "rxfm";
import { Observable } from "rxjs";
import { AttributeObject, attributes, Attributes, AttributeType, classes, HTMLAttributes, styles, SVGAttributes } from "../attributes";
import { ElementType, htmlComponentCreator, svgComponentCreator } from "../components";
import { EventHandler, EventHandlers, events, ElementEventMap } from "../events";
import { coerceToArray, PartialRecord, recursiveFlatten, TypeOrObservable } from "../utils";
import { ElementEventNameMap } from "./element-event-name-map";
import { RxfmSVGElementTagNameMap, SVGTagNameMap, svgTagNameMap } from "./svg-tag-name-map";

export type ElementChild = ComponentChild | ElementChild[];

export interface DefaultProps<T extends ElementType = ElementType> {
  children?: ElementChild;
  style?: Styles | Observable<StyleObject>;
  class?: ClassType | ClassType[];
  attributes?: Attributes | Observable<AttributeObject>;
  events?: EventHandlers<T>;
}

export type EventHandlerProps<T extends ElementType = ElementType> = {
  [K in keyof ElementEventNameMap]?: EventHandler<T, ElementEventNameMap[K]>;
};

export type AttributesProps<K extends string> = PartialRecord<K, TypeOrObservable<AttributeType>>;

export type HTMLElementProps<K extends keyof HTMLElementTagNameMap> =
  AttributesProps<keyof HTMLAttributes> &
  EventHandlerProps<HTMLElementTagNameMap[K]>;

export type SVGElementProps<K extends keyof SVGElementTagNameMap> =
  AttributesProps<keyof SVGAttributes> &
  EventHandlerProps<SVGElementTagNameMap[K]>;

type IntrinsicHTMLElements = {
  [K in keyof HTMLElementTagNameMap]: HTMLElementProps<K> & DefaultProps<HTMLElementTagNameMap[K]>;
};

type IntrinsicSVGElements = {
  [K in keyof RxfmSVGElementTagNameMap]: SVGElementProps<SVGTagNameMap[K]> & DefaultProps<RxfmSVGElementTagNameMap[K]>;
};

declare namespace RxFM {
  namespace JSX {
    interface Element extends Component {}
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicAttributes extends DefaultProps {}
    interface IntrinsicElements extends IntrinsicHTMLElements, IntrinsicSVGElements {}
  }
}

export type WithChildren<T> = T & {
  children?: ElementChild;
};

// TODO: Find a way to allow children type to be redefined? We can make the FV definition work with `keyof T extends 'children'`,
// how do we allow this type to be used with the DefaultProps.children definition in an element?
export type FC<T = {}> = (props: WithChildren<T>) => RxFM.JSX.Element;

function createElement(
  tagName: keyof HTMLElementTagNameMap | keyof RxfmSVGElementTagNameMap,
  props: DefaultProps & (IntrinsicHTMLElements[keyof HTMLElementTagNameMap] | IntrinsicSVGElements[keyof RxfmSVGElementTagNameMap]),
  ...children: ElementChild[]
): RxFM.JSX.Element;
function createElement<T extends Record<string, any>>(
  functionComponent: FC<T>,
  props: DefaultProps & T,
  ...children: ElementChild[]
): RxFM.JSX.Element;
function createElement<T extends Record<string, any>>(
  tagOrFc: keyof HTMLElementTagNameMap | keyof RxfmSVGElementTagNameMap | FC<T>,
  props: DefaultProps & T,
  ...childrenInput: ElementChild[]
): RxFM.JSX.Element {
  let component: RxFM.JSX.Element;

  const children = recursiveFlatten(childrenInput.length ? childrenInput : props?.children || []);
  
  const customProps = { ...props };
  delete customProps.children;
  delete customProps.style;
  delete customProps.class;
  delete customProps.attributes;
  delete customProps.events;

  if (typeof tagOrFc === 'function') {
    component = tagOrFc({ ...customProps, children });

  } else if (typeof tagOrFc === 'string') {
    const { attributeProps, eventProps } = Object.entries(customProps).reduce((acc, [key, value]) => {
      if (key.startsWith('on')) {
        const eventName = key.slice(2).toLowerCase() as keyof ElementEventMap;
        acc.eventProps[eventName] = value as EventHandler<ElementType, keyof ElementEventMap>;
      } else {
        acc.attributeProps[key as keyof T] = value;
      }
      return acc;
    }, {
      attributeProps: {} as Partial<T>,
      eventProps: {} as Record<keyof ElementEventMap, EventHandler<ElementType, keyof ElementEventMap>>,
    });

    component = Object.prototype.hasOwnProperty.call(svgTagNameMap, tagOrFc) ?
      svgComponentCreator(svgTagNameMap[tagOrFc as keyof RxfmSVGElementTagNameMap])(...children) :
      htmlComponentCreator(tagOrFc as keyof HTMLElementTagNameMap)(...children);
    
    component = component.pipe(
      (Object.keys(attributeProps).length ? attributes(attributeProps) : src => src),
      (Object.keys(eventProps).length ? events(eventProps) : src => src),
    );
  } else {
    throw new TypeError(`Invalid type passed as JSX tag. Expected string or FC, received: ${typeof tagOrFc}.`);
  }

  return component.pipe(
    (props?.class ? classes(...coerceToArray(props.class)) : src => src),
    (props?.style ? styles(props.style) : src => src),
    (props?.attributes ? attributes(props.attributes) : src => src),
    (props?.events ? events(props.events) : src => src),
  );
}

const RxFM = { createElement };

export default RxFM;
