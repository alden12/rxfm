import { ComponentCreatorFunction, ComponentFunction, IComponentArgs, component } from './creator';
import { ChildComponent, children } from '../children/children';
import { RxFMElement } from './component';
import { of } from 'rxjs';
import { attributes } from '../attributes';

export type HTMLElementTypes = {
  [K in keyof HTMLElementTagNameMap]: K;
};

const HTMLElements: HTMLElementTypes = {
  a: 'a',
  abbr: 'abbr',
  address: 'address',
  applet: 'applet',
  area: 'area',
  article: 'article',
  aside: 'aside',
  audio: 'audio',
  b: 'b',
  base: 'base',
  basefont: 'basefont',
  bdi: 'bdi',
  bdo: 'bdo',
  blockquote: 'blockquote',
  body: 'body',
  br: 'br',
  button: 'button',
  canvas: 'canvas',
  caption: 'caption',
  cite: 'cite',
  code: 'code',
  col: 'col',
  colgroup: 'colgroup',
  data: 'data',
  datalist: 'datalist',
  dd: 'dd',
  del: 'del',
  details: 'details',
  dfn: 'dfn',
  dialog: 'dialog',
  dir: 'dir',
  div: 'div',
  dl: 'dl',
  dt: 'dt',
  em: 'em',
  embed: 'embed',
  fieldset: 'fieldset',
  figcaption: 'figcaption',
  figure: 'figure',
  font: 'font',
  footer: 'footer',
  form: 'form',
  frame: 'frame',
  frameset: 'frameset',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  head: 'head',
  header: 'header',
  hgroup: 'hgroup',
  hr: 'hr',
  html: 'html',
  i: 'i',
  iframe: 'iframe',
  img: 'img',
  input: 'input',
  ins: 'ins',
  kbd: 'kbd',
  label: 'label',
  legend: 'legend',
  li: 'li',
  link: 'link',
  main: 'main',
  map: 'map',
  mark: 'mark',
  marquee: 'marquee',
  menu: 'menu',
  meta: 'meta',
  meter: 'meter',
  nav: 'nav',
  noscript: 'noscript',
  object: 'object',
  ol: 'ol',
  optgroup: 'optgroup',
  option: 'option',
  output: 'output',
  p: 'p',
  param: 'param',
  picture: 'picture',
  pre: 'pre',
  progress: 'progress',
  q: 'q',
  rp: 'rp',
  rt: 'rt',
  ruby: 'ruby',
  s: 's',
  samp: 'samp',
  script: 'script',
  section: 'section',
  select: 'select',
  slot: 'slot',
  small: 'small',
  source: 'source',
  span: 'span',
  strong: 'strong',
  style: 'style',
  sub: 'sub',
  summary: 'summary',
  sup: 'sup',
  table: 'table',
  tbody: 'tbody',
  td: 'td',
  template: 'template',
  textarea: 'textarea',
  tfoot: 'tfoot',
  th: 'th',
  thead: 'thead',
  time: 'time',
  title: 'title',
  tr: 'tr',
  track: 'track',
  u: 'u',
  ul: 'ul',
  var: 'var',
  video: 'video',
  wbr: 'wbr',
};

function getHTMLComponentFunction<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
): ComponentFunction<HTMLElementTagNameMap[K]> {
  return<C extends ChildComponent[] = []>(args: IComponentArgs<C>) =>
  of(new RxFMElement(document.createElement(tagName))).pipe(
    children(...args.children),
    attributes(args.attributes),
  );
}

export type HTMLComponentCreators = {
  [K in keyof HTMLElementTagNameMap]: ComponentCreatorFunction<HTMLElementTagNameMap[K]>;
};

export const HTML: HTMLComponentCreators = Object.keys(HTMLElements).reduce(
  (components: HTMLComponentCreators, tagName: keyof HTMLElementTagNameMap) => {
    components[tagName] = component(getHTMLComponentFunction(tagName)) as ComponentCreatorFunction<any>;
    return components;
  }, {} as HTMLComponentCreators
);

export const div = HTML.div;
export const span = HTML.span;
export const input = HTML.input;
export const button = HTML.button;
export const h1 = HTML.h1;
export const h2 = HTML.h2;
export const h3 = HTML.h3;
export const h4 = HTML.h4;
export const h5 = HTML.h5;
export const h6 = HTML.h6;
export const hr = HTML.hr;
export const img = HTML.img;
export const p = HTML.p;
export const a = HTML.a;
export const ul = HTML.ul;
export const ol = HTML.ol;
export const li = HTML.li;
export const i = HTML.i;
export const iframe = HTML.iframe;
export const link = HTML.link;
export const table = HTML.table;
export const td = HTML.td;
export const tr = HTML.tr;
export const textarea = HTML.textarea;
// TODO: Add more default elements.
