/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { ComponentChild, Component, Styles, StyleObject, ClassType } from "rxfm";
import { combineLatest, Observable } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { AttributeObject, attributes, Attributes, AttributeType, classes, HTMLAttributes, styles, SVGAttributes } from "../attributes";
import { ElementType, htmlComponentCreator, svgComponentCreator } from "../components";
import { EventHandler, EventHandlers, events, ElementEventMap } from "../events";
import { coerceToArray, coerceToObservable, destructure, DestructuredObservable, flatten, PartialRecord, TypeOrObservable } from "../utils";
import { ElementEventNameMap } from "./element-event-name-map";
import { SVGTagNameMap, svgTagNameMap, SvgTagNames } from "./svg-tag-name-map";

export interface DefaultProps<T extends ElementType = ElementType> {
  children?: ComponentChild | (ComponentChild | ComponentChild[])[];
  style?: Styles | Observable<StyleObject>;
  class?: ClassType | ClassType[];
  attributes?: Attributes | Observable<AttributeObject>;
  events?: EventHandlers<T>;
}

type EventHandlerProps<T extends ElementType = ElementType> = {
  [K in keyof ElementEventNameMap]?: EventHandler<T, ElementEventNameMap[K]>;
};

type AttributesProps<K extends string> = PartialRecord<K, TypeOrObservable<AttributeType>>;

type IntrinsicHTMLElements = {
  [K in keyof HTMLElementTagNameMap]:
    DefaultProps<HTMLElementTagNameMap[K]> &
    AttributesProps<keyof HTMLAttributes> &
    EventHandlerProps<HTMLElementTagNameMap[K]>
};

type IntrinsicSVGElements = {
  [K in SvgTagNames]:
    DefaultProps<SVGElementTagNameMap[SVGTagNameMap[K]]> &
    AttributesProps<keyof SVGAttributes> &
    EventHandlerProps<SVGElementTagNameMap[SVGTagNameMap[K]]>
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

type StaticProps<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Observable<infer U> ? U : T[K];
};

type UseProps<T extends Record<string, any>> = {
  <U>(mappingFunction: (props: StaticProps<T>) => U): DestructuredObservable<U>;
  <U, D extends (keyof T)[]>(
    mappingFunction: (props: Pick<StaticProps<T>, D[number]>) => U,
    dependencies?: D,
  ): DestructuredObservable<U>;
};

function usePropsFor<T extends Record<string, any>>(props: T): UseProps<T> {
  return <U>(mappingFunction: (props: Pick<StaticProps<T>, keyof T>) => U, deps?: (keyof T)[]) => {
    const observableEntries = Object.entries(props)
      .filter(([key]) => !deps || deps.includes(key))
      .map(([key, value]: [keyof T, T[keyof T]]) => coerceToObservable(value).pipe(
        distinctUntilChanged(),
        map(val => [key, val] as const),
      ),
    );

    return destructure(
      combineLatest(observableEntries).pipe(
        map(entries => entries.reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {} as Partial<StaticProps<T>>) as StaticProps<T>),
        map(mappingFunction),
      ),
    );
  };
}

export type WithChildren<T> = T & {
  children?: ComponentChild | ComponentChild[];
};

// TODO: Find a way to allow children type to be redefined? Can make this definition work with `keyof T extends 'children'`,
// React seems to fix element children inference by allowing any child type.
export type FC<T = {}> = (props: WithChildren<T>, useProps: UseProps<T>) => RxFM.JSX.Element;

function createElement(
  tagName: keyof HTMLElementTagNameMap | SvgTagNames,
  props: DefaultProps & (IntrinsicHTMLElements[keyof HTMLElementTagNameMap] | IntrinsicSVGElements[SvgTagNames]),
  ...children: (ComponentChild | ComponentChild[])[]
): RxFM.JSX.Element;
function createElement<T extends Record<string, any>>(
  functionComponent: FC<T>,
  props: DefaultProps & T,
  ...children: (ComponentChild | ComponentChild[])[]
): RxFM.JSX.Element;
function createElement<T extends Record<string, any>>(
  tagOrFc: keyof HTMLElementTagNameMap | SvgTagNames | FC<T>,
  props: DefaultProps & T,
  ...childrenInput: (ComponentChild | ComponentChild[])[]
): RxFM.JSX.Element {
  let component: RxFM.JSX.Element;

  const children = flatten<ComponentChild>(childrenInput);
  
  const customProps = { ...props };
  delete customProps.style;
  delete customProps.class;
  delete customProps.attributes;
  delete customProps.events;

  if (typeof tagOrFc === 'function') {
    component = tagOrFc({ ...customProps, children }, usePropsFor(customProps));

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
      svgComponentCreator(svgTagNameMap[tagOrFc as SvgTagNames])(...children) :
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
