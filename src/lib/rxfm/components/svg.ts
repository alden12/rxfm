import { componentCreator, ComponentCreator } from "./component";

const SVGNamespace = 'http://www.w3.org/2000/svg';

function getSVGComponentCreator<K extends keyof SVGElementTagNameMap>(
  tagName: K,
): ComponentCreator<SVGElementTagNameMap[K]> {
  return componentCreator(() => document.createElementNS(SVGNamespace, tagName));
}

export const SvgA = getSVGComponentCreator('a');
export const Circle = getSVGComponentCreator('circle');
export const ClipPath = getSVGComponentCreator('clipPath');
export const Defs = getSVGComponentCreator('defs');
export const Desc = getSVGComponentCreator('desc');
export const Ellipse = getSVGComponentCreator('ellipse');
export const FeBlend = getSVGComponentCreator('feBlend');
export const FeColorMatrix = getSVGComponentCreator('feColorMatrix');
export const FeComponentTransfer = getSVGComponentCreator('feComponentTransfer');
export const FeComposite = getSVGComponentCreator('feComposite');
export const FeConvolveMatrix = getSVGComponentCreator('feConvolveMatrix');
export const FeDiffuseLighting = getSVGComponentCreator('feDiffuseLighting');
export const FeDisplacementMap = getSVGComponentCreator('feDisplacementMap');
export const FeDistantLight = getSVGComponentCreator('feDistantLight');
export const FeFlood = getSVGComponentCreator('feFlood');
export const FeFuncA = getSVGComponentCreator('feFuncA');
export const FeFuncB = getSVGComponentCreator('feFuncB');
export const FeFuncG = getSVGComponentCreator('feFuncG');
export const FeFuncR = getSVGComponentCreator('feFuncR');
export const FeGaussianBlur = getSVGComponentCreator('feGaussianBlur');
export const FeImage = getSVGComponentCreator('feImage');
export const FeMerge = getSVGComponentCreator('feMerge');
export const FeMergeNode = getSVGComponentCreator('feMergeNode');
export const FeMorphology = getSVGComponentCreator('feMorphology');
export const FeOffset = getSVGComponentCreator('feOffset');
export const FePointLight = getSVGComponentCreator('fePointLight');
export const FeSpecularLighting = getSVGComponentCreator('feSpecularLighting');
export const FeSpotLight = getSVGComponentCreator('feSpotLight');
export const FeTile = getSVGComponentCreator('feTile');
export const FeTurbulence = getSVGComponentCreator('feTurbulence');
export const Filter = getSVGComponentCreator('filter');
export const ForeignObject = getSVGComponentCreator('foreignObject');
export const G = getSVGComponentCreator('g');
export const Image = getSVGComponentCreator('image');
export const Line = getSVGComponentCreator('line');
export const LinearGradient = getSVGComponentCreator('linearGradient');
export const Marker = getSVGComponentCreator('marker');
export const Mask = getSVGComponentCreator('mask');
export const Metadata = getSVGComponentCreator('metadata');
export const Path = getSVGComponentCreator('path');
export const Pattern = getSVGComponentCreator('pattern');
export const Polygon = getSVGComponentCreator('polygon');
export const Polyline = getSVGComponentCreator('polyline');
export const RadialGradient = getSVGComponentCreator('radialGradient');
export const Rect = getSVGComponentCreator('rect');
export const SvgScript = getSVGComponentCreator('script');
export const Stop = getSVGComponentCreator('stop');
export const SvgStyle = getSVGComponentCreator('style');
export const Svg = getSVGComponentCreator('svg');
export const Switch = getSVGComponentCreator('switch');
export const Symbol = getSVGComponentCreator('symbol');
export const Text = getSVGComponentCreator('text');
export const TextPath = getSVGComponentCreator('textPath');
export const SvgTitle = getSVGComponentCreator('title');
export const Tspan = getSVGComponentCreator('tspan');
export const Use = getSVGComponentCreator('use');
export const View = getSVGComponentCreator('view');
