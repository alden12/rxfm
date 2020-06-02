import { ComponentCreatorFunction, ComponentFunction } from './creator';
import { ChildComponent, children } from '../children/children';
import { Component } from './component';
import { of } from 'rxjs';
import { IAttributes, attributes } from '../attributes';

export type SVGElementTypes = {
  [K in keyof SVGElementTagNameMap]: K;
};

const SVGElements: SVGElementTypes = {
  a: 'a',
  circle: 'circle',
  clipPath: 'clipPath',
  defs: 'defs',
  desc: 'desc',
  ellipse: 'ellipse',
  feBlend: 'feBlend',
  feColorMatrix: 'feColorMatrix',
  feComponentTransfer: 'feComponentTransfer',
  feComposite: 'feComposite',
  feConvolveMatrix: 'feConvolveMatrix',
  feDiffuseLighting: 'feDiffuseLighting',
  feDisplacementMap: 'feDisplacementMap',
  feDistantLight: 'feDistantLight',
  feFlood: 'feFlood',
  feFuncA: 'feFuncA',
  feFuncB: 'feFuncB',
  feFuncG: 'feFuncG',
  feFuncR: 'feFuncR',
  feGaussianBlur: 'feGaussianBlur',
  feImage: 'feImage',
  feMerge: 'feMerge',
  feMergeNode: 'feMergeNode',
  feMorphology: 'feMorphology',
  feOffset: 'feOffset',
  fePointLight: 'fePointLight',
  feSpecularLighting: 'feSpecularLighting',
  feSpotLight: 'feSpotLight',
  feTile: 'feTile',
  feTurbulence: 'feTurbulence',
  filter: 'filter',
  foreignObject: 'foreignObject',
  g: 'g',
  image: 'image',
  line: 'line',
  linearGradient: 'linearGradient',
  marker: 'marker',
  mask: 'mask',
  metadata: 'metadata',
  path: 'path',
  pattern: 'pattern',
  polygon: 'polygon',
  polyline: 'polyline',
  radialGradient: 'radialGradient',
  rect: 'rect',
  script: 'script',
  stop: 'stop',
  style: 'style',
  svg: 'svg',
  switch: 'switch',
  symbol: 'symbol',
  text: 'text',
  textPath: 'textPath',
  title: 'title',
  tspan: 'tspan',
  use: 'use',
  view: 'view',
};

const SVGNamespace = 'http://www.w3.org/2000/svg';

function getSVGComponentFunction<K extends keyof SVGElementTagNameMap>(
  tagName: K,
): ComponentFunction<SVGElementTagNameMap[K]> {
  return<C extends ChildComponent[] = []>(childComponents: C, _attributes: IAttributes) =>
    of(new Component(document.createElementNS(SVGNamespace, tagName))).pipe(
      children(...childComponents),
      attributes(_attributes),
    );
}

export type SVGComponentCreators = {
  [K in keyof SVGElementTagNameMap]: ComponentCreatorFunction<SVGElementTagNameMap[K]>;
};

export const SVG: SVGComponentCreators = Object.keys(SVGElements).reduce(
  (components: SVGComponentCreators, tagName: keyof SVGElementTagNameMap) => {
    components[tagName] = Component.wrap(getSVGComponentFunction(tagName)) as ComponentCreatorFunction<any>;
    return components;
  }, {} as SVGComponentCreators
);

export const svg = SVG.svg;
export const g = SVG.g;
// TODO: Add more default element types.
