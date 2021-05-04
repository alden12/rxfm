import { componentCreator, ComponentCreator, componentFunction } from "./component";

const SVGNamespace = 'http://www.w3.org/2000/svg';

function svgComponentCreator<K extends keyof SVGElementTagNameMap>(
  tagName: K,
): ComponentCreator<SVGElementTagNameMap[K]> {
  return componentCreator(
    componentFunction(() => document.createElementNS(SVGNamespace, tagName)),
  );
}

export const SvgA = svgComponentCreator('a');
export const Circle = svgComponentCreator('circle');
export const ClipPath = svgComponentCreator('clipPath');
export const Defs = svgComponentCreator('defs');
export const Desc = svgComponentCreator('desc');
export const Ellipse = svgComponentCreator('ellipse');
export const FeBlend = svgComponentCreator('feBlend');
export const FeColorMatrix = svgComponentCreator('feColorMatrix');
export const FeComponentTransfer = svgComponentCreator('feComponentTransfer');
export const FeComposite = svgComponentCreator('feComposite');
export const FeConvolveMatrix = svgComponentCreator('feConvolveMatrix');
export const FeDiffuseLighting = svgComponentCreator('feDiffuseLighting');
export const FeDisplacementMap = svgComponentCreator('feDisplacementMap');
export const FeDistantLight = svgComponentCreator('feDistantLight');
export const FeFlood = svgComponentCreator('feFlood');
export const FeFuncA = svgComponentCreator('feFuncA');
export const FeFuncB = svgComponentCreator('feFuncB');
export const FeFuncG = svgComponentCreator('feFuncG');
export const FeFuncR = svgComponentCreator('feFuncR');
export const FeGaussianBlur = svgComponentCreator('feGaussianBlur');
export const FeImage = svgComponentCreator('feImage');
export const FeMerge = svgComponentCreator('feMerge');
export const FeMergeNode = svgComponentCreator('feMergeNode');
export const FeMorphology = svgComponentCreator('feMorphology');
export const FeOffset = svgComponentCreator('feOffset');
export const FePointLight = svgComponentCreator('fePointLight');
export const FeSpecularLighting = svgComponentCreator('feSpecularLighting');
export const FeSpotLight = svgComponentCreator('feSpotLight');
export const FeTile = svgComponentCreator('feTile');
export const FeTurbulence = svgComponentCreator('feTurbulence');
export const Filter = svgComponentCreator('filter');
export const ForeignObject = svgComponentCreator('foreignObject');
export const G = svgComponentCreator('g');
export const Image = svgComponentCreator('image');
export const Line = svgComponentCreator('line');
export const LinearGradient = svgComponentCreator('linearGradient');
export const Marker = svgComponentCreator('marker');
export const Mask = svgComponentCreator('mask');
export const Metadata = svgComponentCreator('metadata');
export const Path = svgComponentCreator('path');
export const Pattern = svgComponentCreator('pattern');
export const Polygon = svgComponentCreator('polygon');
export const Polyline = svgComponentCreator('polyline');
export const RadialGradient = svgComponentCreator('radialGradient');
export const Rect = svgComponentCreator('rect');
export const SvgScript = svgComponentCreator('script');
export const Stop = svgComponentCreator('stop');
export const SvgStyle = svgComponentCreator('style');
export const Svg = svgComponentCreator('svg');
export const Switch = svgComponentCreator('switch');
export const Symbol = svgComponentCreator('symbol');
export const Text = svgComponentCreator('text');
export const TextPath = svgComponentCreator('textPath');
export const SvgTitle = svgComponentCreator('title');
export const Tspan = svgComponentCreator('tspan');
export const Use = svgComponentCreator('use');
export const View = svgComponentCreator('view');
