import { ComponentCreator } from './factory';

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

function svgElementCreator<K extends keyof SVGElementTagNameMap>(tagName: K): () => SVGElementTagNameMap[K] {
  return () => document.createElementNS(SVGNamespace, tagName);
}

export type SVGComponents = {
  [K in keyof SVGElementTagNameMap]: ComponentCreator<SVGElementTagNameMap[K]>;
};

// export const SVG: SVGComponents = Object.keys(SVGElements).reduce(
//   (components: SVGComponents, tagName: keyof SVGElementTagNameMap) => {
//     components[tagName] = componentFactory(svgElementCreator(tagName)) as ComponentCreator<any>;
//     return components;
//   }, {} as SVGComponents
// );

// export const svg = SVG.svg;
// export const g = SVG.g;
// TODO: Add more default element types.
