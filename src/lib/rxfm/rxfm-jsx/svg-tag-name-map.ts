export const svgTagNameMap = {
  svgA: 'a' as const,
  circle: 'circle' as const,
  clipPath: 'clipPath' as const,
  defs: 'defs' as const,
  desc: 'desc' as const,
  ellipse: 'ellipse' as const,
  feBlend: 'feBlend' as const,
  feColorMatrix: 'feColorMatrix' as const,
  feComponentTransfer: 'feComponentTransfer' as const,
  feComposite: 'feComposite' as const,
  feConvolveMatrix: 'feConvolveMatrix' as const,
  feDiffuseLighting: 'feDiffuseLighting' as const,
  feDisplacementMap: 'feDisplacementMap' as const,
  feDistantLight: 'feDistantLight' as const,
  feFlood: 'feFlood' as const,
  feFuncA: 'feFuncA' as const,
  feFuncB: 'feFuncB' as const,
  feFuncG: 'feFuncG' as const,
  feFuncR: 'feFuncR' as const,
  feGaussianBlur: 'feGaussianBlur' as const,
  feImage: 'feImage' as const,
  feMerge: 'feMerge' as const,
  feMergeNode: 'feMergeNode' as const,
  feMorphology: 'feMorphology' as const,
  feOffset: 'feOffset' as const,
  fePointLight: 'fePointLight' as const,
  feSpecularLighting: 'feSpecularLighting' as const,
  feSpotLight: 'feSpotLight' as const,
  feTile: 'feTile' as const,
  feTurbulence: 'feTurbulence' as const,
  filter: 'filter' as const,
  foreignObject: 'foreignObject' as const,
  g: 'g' as const,
  image: 'image' as const,
  line: 'line' as const,
  linearGradient: 'linearGradient' as const,
  marker: 'marker' as const,
  mask: 'mask' as const,
  metadata: 'metadata' as const,
  path: 'path' as const,
  pattern: 'pattern' as const,
  polygon: 'polygon' as const,
  polyline: 'polyline' as const,
  radialGradient: 'radialGradient' as const,
  rect: 'rect' as const,
  svgScript: 'script' as const,
  stop: 'stop' as const,
  svgStyle: 'style' as const,
  svg: 'svg' as const,
  switch: 'switch' as const,
  symbol: 'symbol' as const,
  text: 'text' as const,
  textPath: 'textPath' as const,
  svgTitle: 'title' as const,
  tspan: 'tspan' as const,
  use: 'use' as const,
  view: 'view' as const,
};

export type SVGTagNameMap = typeof svgTagNameMap;

export type RxfmSVGElementTagNameMap = {
  [K in keyof SVGTagNameMap]: SVGElementTagNameMap[SVGTagNameMap[K]];
};

