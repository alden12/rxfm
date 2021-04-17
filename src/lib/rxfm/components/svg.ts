import { of } from "rxjs";
import { map } from "rxjs/operators";
import { children } from "../children/children";
import { ComponentFunction } from "./component";

const SVGNamespace = 'http://www.w3.org/2000/svg';

function getSVGComponentFunction<K extends keyof SVGElementTagNameMap>(
  tagName: K,
): ComponentFunction<SVGElementTagNameMap[K]> {
  return (...childElements) => of(tagName).pipe(
    map(tag => document.createElementNS(SVGNamespace, tag)),
    children(...childElements),
  );
}

export const SvgA = getSVGComponentFunction('a');
export const Circle = getSVGComponentFunction('circle');
export const ClipPath = getSVGComponentFunction('clipPath');
export const Defs = getSVGComponentFunction('defs');
export const Desc = getSVGComponentFunction('desc');
export const Ellipse = getSVGComponentFunction('ellipse');
export const FeBlend = getSVGComponentFunction('feBlend');
export const FeColorMatrix = getSVGComponentFunction('feColorMatrix');
export const FeComponentTransfer = getSVGComponentFunction('feComponentTransfer');
export const FeComposite = getSVGComponentFunction('feComposite');
export const FeConvolveMatrix = getSVGComponentFunction('feConvolveMatrix');
export const FeDiffuseLighting = getSVGComponentFunction('feDiffuseLighting');
export const FeDisplacementMap = getSVGComponentFunction('feDisplacementMap');
export const FeDistantLight = getSVGComponentFunction('feDistantLight');
export const FeFlood = getSVGComponentFunction('feFlood');
export const FeFuncA = getSVGComponentFunction('feFuncA');
export const FeFuncB = getSVGComponentFunction('feFuncB');
export const FeFuncG = getSVGComponentFunction('feFuncG');
export const FeFuncR = getSVGComponentFunction('feFuncR');
export const FeGaussianBlur = getSVGComponentFunction('feGaussianBlur');
export const FeImage = getSVGComponentFunction('feImage');
export const FeMerge = getSVGComponentFunction('feMerge');
export const FeMergeNode = getSVGComponentFunction('feMergeNode');
export const FeMorphology = getSVGComponentFunction('feMorphology');
export const FeOffset = getSVGComponentFunction('feOffset');
export const FePointLight = getSVGComponentFunction('fePointLight');
export const FeSpecularLighting = getSVGComponentFunction('feSpecularLighting');
export const FeSpotLight = getSVGComponentFunction('feSpotLight');
export const FeTile = getSVGComponentFunction('feTile');
export const FeTurbulence = getSVGComponentFunction('feTurbulence');
export const Filter = getSVGComponentFunction('filter');
export const ForeignObject = getSVGComponentFunction('foreignObject');
export const G = getSVGComponentFunction('g');
export const Image = getSVGComponentFunction('image');
export const Line = getSVGComponentFunction('line');
export const LinearGradient = getSVGComponentFunction('linearGradient');
export const Marker = getSVGComponentFunction('marker');
export const Mask = getSVGComponentFunction('mask');
export const Metadata = getSVGComponentFunction('metadata');
export const Path = getSVGComponentFunction('path');
export const Pattern = getSVGComponentFunction('pattern');
export const Polygon = getSVGComponentFunction('polygon');
export const Polyline = getSVGComponentFunction('polyline');
export const RadialGradient = getSVGComponentFunction('radialGradient');
export const Rect = getSVGComponentFunction('rect');
export const SvgScript = getSVGComponentFunction('script');
export const Stop = getSVGComponentFunction('stop');
export const SvgStyle = getSVGComponentFunction('style');
export const Svg = getSVGComponentFunction('svg');
export const Switch = getSVGComponentFunction('switch');
export const Symbol = getSVGComponentFunction('symbol');
export const Text = getSVGComponentFunction('text');
export const TextPath = getSVGComponentFunction('textPath');
export const SvgTitle = getSVGComponentFunction('title');
export const Tspan = getSVGComponentFunction('tspan');
export const Use = getSVGComponentFunction('use');
export const View = getSVGComponentFunction('view');
