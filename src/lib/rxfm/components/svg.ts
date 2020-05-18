import { componentFactory } from './factory';

const SVGNamespace = 'http://www.w3.org/2000/svg';

function svgElementCreator<K extends keyof SVGElementTagNameMap>(tagName: K): () => SVGElementTagNameMap[K] {
  return () => document.createElementNS(SVGNamespace, tagName);
}

export const SVG = {
  // a: componentFactory(svgElementCreator('a')),
  // circle: componentFactory(svgElementCreator('circle')),
  // clipPath: componentFactory(svgElementCreator('clipPath')),
  // defs: componentFactory(svgElementCreator('defs')),
  // desc: componentFactory(svgElementCreator('desc')),
  // ellipse: componentFactory(svgElementCreator('ellipse')),
  // feBlend: componentFactory(svgElementCreator('feBlend')),
  // feColorMatrix: componentFactory(svgElementCreator('feColorMatrix')),
  // feComponentTransfer: componentFactory(svgElementCreator('feComponentTransfer')),
  // feComposite: componentFactory(svgElementCreator('feComposite')),
  // feConvolveMatrix: componentFactory(svgElementCreator('feConvolveMatrix')),
  // feDiffuseLighting: componentFactory(svgElementCreator('feDiffuseLighting')),
  // feDisplacementMap: componentFactory(svgElementCreator('feDisplacementMap')),
  // feDistantLight: componentFactory(svgElementCreator('feDistantLight')),
  // feFlood: componentFactory(svgElementCreator('feFlood')),
  // feFuncA: componentFactory(svgElementCreator('feFuncA')),
  // feFuncB: componentFactory(svgElementCreator('feFuncB')),
  // feFuncG: componentFactory(svgElementCreator('feFuncG')),
  // feFuncR: componentFactory(svgElementCreator('feFuncR')),
  // feGaussianBlur: componentFactory(svgElementCreator('feGaussianBlur')),
  // feImage: componentFactory(svgElementCreator('feImage')),
  // feMerge: componentFactory(svgElementCreator('feMerge')),
  // feMergeNode: componentFactory(svgElementCreator('feMergeNode')),
  // feMorphology: componentFactory(svgElementCreator('feMorphology')),
  // feOffset: componentFactory(svgElementCreator('feOffset')),
  // fePointLight: componentFactory(svgElementCreator('fePointLight')),
  // feSpecularLighting: componentFactory(svgElementCreator('feSpecularLighting')),
  // feSpotLight: componentFactory(svgElementCreator('feSpotLight')),
  // feTile: componentFactory(svgElementCreator('feTile')),
  // feTurbulence: componentFactory(svgElementCreator('feTurbulence')),
  // filter: componentFactory(svgElementCreator('filter')),
  // foreignObject: componentFactory(svgElementCreator('foreignObject')),
  // g: componentFactory(svgElementCreator('g')),
  // image: componentFactory(svgElementCreator('image')),
  // line: componentFactory(svgElementCreator('line')),
  // linearGradient: componentFactory(svgElementCreator('linearGradient')),
  // marker: componentFactory(svgElementCreator('marker')),
  // mask: componentFactory(svgElementCreator('mask')),
  // metadata: componentFactory(svgElementCreator('metadata')),
  // path: componentFactory(svgElementCreator('path')),
  // pattern: componentFactory(svgElementCreator('pattern')),
  // polygon: componentFactory(svgElementCreator('polygon')),
  // polyline: componentFactory(svgElementCreator('polyline')),
  // radialGradient: componentFactory(svgElementCreator('radialGradient')),
  // rect: componentFactory(svgElementCreator('rect')),
  // script: componentFactory(svgElementCreator('script')),
  // stop: componentFactory(svgElementCreator('stop')),
  // style: componentFactory(svgElementCreator('style')),
  // svg: componentFactory(svgElementCreator('svg')),
  // switch: componentFactory(svgElementCreator('switch')),
  // symbol: componentFactory(svgElementCreator('symbol')),
  // text: componentFactory(svgElementCreator('text')),
  // textPath: componentFactory(svgElementCreator('textPath')),
  // title: componentFactory(svgElementCreator('title')),
  // tspan: componentFactory(svgElementCreator('tspan')),
  // use: componentFactory(svgElementCreator('use')),
  // view: componentFactory(svgElementCreator('view')),
};
