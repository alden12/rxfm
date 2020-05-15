import { htmlComponent } from './component'

export const HTML = {
  a: () => htmlComponent('a'),
  abbr: () => htmlComponent('abbr'),
  address: () => htmlComponent('address'),
  applet: () => htmlComponent('applet'),
  area: () => htmlComponent('area'),
  article: () => htmlComponent('article'),
  aside: () => htmlComponent('aside'),
  audio: () => htmlComponent('audio'),
  b: () => htmlComponent('b'),
  base: () => htmlComponent('base'),
  basefont: () => htmlComponent('basefont'),
  bdi: () => htmlComponent('bdi'),
  bdo: () => htmlComponent('bdo'),
  blockquote: () => htmlComponent('blockquote'),
  body: () => htmlComponent('body'),
  br: () => htmlComponent('br'),
  button: () => htmlComponent('button'),
  canvas: () => htmlComponent('canvas'),
  caption: () => htmlComponent('caption'),
  cite: () => htmlComponent('cite'),
  code: () => htmlComponent('code'),
  col: () => htmlComponent('col'),
  colgroup: () => htmlComponent('colgroup'),
  data: () => htmlComponent('data'),
  datalist: () => htmlComponent('datalist'),
  dd: () => htmlComponent('dd'),
  del: () => htmlComponent('del'),
  details: () => htmlComponent('details'),
  dfn: () => htmlComponent('dfn'),
  dialog: () => htmlComponent('dialog'),
  dir: () => htmlComponent('dir'),
  div: () => htmlComponent('div'),
  dl: () => htmlComponent('dl'),
  dt: () => htmlComponent('dt'),
  em: () => htmlComponent('em'),
  embed: () => htmlComponent('embed'),
  fieldset: () => htmlComponent('fieldset'),
  figcaption: () => htmlComponent('figcaption'),
  figure: () => htmlComponent('figure'),
  font: () => htmlComponent('font'),
  footer: () => htmlComponent('footer'),
  form: () => htmlComponent('form'),
  frame: () => htmlComponent('frame'),
  frameset: () => htmlComponent('frameset'),
  h1: () => htmlComponent('h1'),
  h2: () => htmlComponent('h2'),
  h3: () => htmlComponent('h3'),
  h4: () => htmlComponent('h4'),
  h5: () => htmlComponent('h5'),
  h6: () => htmlComponent('h6'),
  head: () => htmlComponent('head'),
  header: () => htmlComponent('header'),
  hgroup: () => htmlComponent('hgroup'),
  hr: () => htmlComponent('hr'),
  html: () => htmlComponent('html'),
  i: () => htmlComponent('i'),
  iframe: () => htmlComponent('iframe'),
  img: () => htmlComponent('img'),
  input: () => htmlComponent('input'),
  ins: () => htmlComponent('ins'),
  kbd: () => htmlComponent('kbd'),
  label: () => htmlComponent('label'),
  legend: () => htmlComponent('legend'),
  li: () => htmlComponent('li'),
  link: () => htmlComponent('link'),
  main: () => htmlComponent('main'),
  map: () => htmlComponent('map'),
  mark: () => htmlComponent('mark'),
  marquee: () => htmlComponent('marquee'),
  menu: () => htmlComponent('menu'),
  meta: () => htmlComponent('meta'),
  meter: () => htmlComponent('meter'),
  nav: () => htmlComponent('nav'),
  noscript: () => htmlComponent('noscript'),
  object: () => htmlComponent('object'),
  ol: () => htmlComponent('ol'),
  optgroup: () => htmlComponent('optgroup'),
  option: () => htmlComponent('option'),
  output: () => htmlComponent('output'),
  p: () => htmlComponent('p'),
  param: () => htmlComponent('param'),
  picture: () => htmlComponent('picture'),
  pre: () => htmlComponent('pre'),
  progress: () => htmlComponent('progress'),
  q: () => htmlComponent('q'),
  rp: () => htmlComponent('rp'),
  rt: () => htmlComponent('rt'),
  ruby: () => htmlComponent('ruby'),
  s: () => htmlComponent('s'),
  samp: () => htmlComponent('samp'),
  script: () => htmlComponent('script'),
  section: () => htmlComponent('section'),
  select: () => htmlComponent('select'),
  slot: () => htmlComponent('slot'),
  small: () => htmlComponent('small'),
  source: () => htmlComponent('source'),
  span: () => htmlComponent('span'),
  strong: () => htmlComponent('strong'),
  style: () => htmlComponent('style'),
  sub: () => htmlComponent('sub'),
  summary: () => htmlComponent('summary'),
  sup: () => htmlComponent('sup'),
  table: () => htmlComponent('table'),
  tbody: () => htmlComponent('tbody'),
  td: () => htmlComponent('td'),
  template: () => htmlComponent('template'),
  textarea: () => htmlComponent('textarea'),
  tfoot: () => htmlComponent('tfoot'),
  th: () => htmlComponent('th'),
  thead: () => htmlComponent('thead'),
  time: () => htmlComponent('time'),
  title: () => htmlComponent('title'),
  tr: () => htmlComponent('tr'),
  track: () => htmlComponent('track'),
  u: () => htmlComponent('u'),
  ul: () => htmlComponent('ul'),
  var: () => htmlComponent('var'),
  video: () => htmlComponent('video'),
  wbr: () => htmlComponent('wbr'),
};

export const div = HTML.div;
export const span = HTML.span;
export const h1 = HTML.h1;
export const h2 = HTML.h2;
export const h3 = HTML.h3;
export const h4 = HTML.h4;
export const h5 = HTML.h5;
export const h6 = HTML.h6;
export const hr = HTML.hr;
export const img = HTML.img;
export const p = HTML.p;
// TODO: Add more default elements eg. table.

// /** Create a component of type html 'a' element. */
// export const a = () => componentOld('a');
// /** Create a component of type html 'abbr' element. */
// export const abbr = () => componentOld('abbr');
// /** Create a component of type html 'address' element. */
// export const address = () => componentOld('address');
// /** Create a component of type html 'applet' element. */
// export const applet = () => componentOld('applet');
// /** Create a component of type html 'area' element. */
// export const area = () => componentOld('area');
// /** Create a component of type html 'article' element. */
// export const article = () => componentOld('article');
// /** Create a component of type html 'aside' element. */
// export const aside = () => componentOld('aside');
// /** Create a component of type html 'audio' element. */
// export const audio = () => componentOld('audio');
// /** Create a component of type html 'b' element. */
// export const b = () => componentOld('b');
// /** Create a component of type html 'base' element. */
// export const base = () => componentOld('base');
// /** Create a component of type html 'basefont' element. */
// export const basefont = () => componentOld('basefont');
// /** Create a component of type html 'bdi' element. */
// export const bdi = () => componentOld('bdi');
// /** Create a component of type html 'bdo' element. */
// export const bdo = () => componentOld('bdo');
// /** Create a component of type html 'blockquote' element. */
// export const blockquote = () => componentOld('blockquote');
// /** Create a component of type html 'body' element. */
// export const body = () => componentOld('body');
// /** Create a component of type html 'br' element. */
// export const br = () => componentOld('br');
// /** Create a component of type html 'button' element. */
// export const button = () => componentOld('button');
// /** Create a component of type html 'canvas' element. */
// export const canvas = () => componentOld('canvas');
// /** Create a component of type html 'caption' element. */
// export const caption = () => componentOld('caption');
// /** Create a component of type html 'cite' element. */
// export const cite = () => componentOld('cite');
// /** Create a component of type html 'code' element. */
// export const code = () => componentOld('code');
// /** Create a component of type html 'col' element. */
// export const col = () => componentOld('col');
// /** Create a component of type html 'colgroup' element. */
// export const colgroup = () => componentOld('colgroup');
// /** Create a component of type html 'data' element. */
// export const data = () => componentOld('data');
// /** Create a component of type html 'datalist' element. */
// export const datalist = () => componentOld('datalist');
// /** Create a component of type html 'dd' element. */
// export const dd = () => componentOld('dd');
// /** Create a component of type html 'del' element. */
// export const del = () => componentOld('del');
// /** Create a component of type html 'details' element. */
// export const details = () => componentOld('details');
// /** Create a component of type html 'dfn' element. */
// export const dfn = () => componentOld('dfn');
// /** Create a component of type html 'dialog' element. */
// export const dialog = () => componentOld('dialog');
// /** Create a component of type html 'dir' element. */
// export const dir = () => componentOld('dir');
// /** Create a component of type html 'div' element. */
// export const div = () => componentOld('div');
// /** Create a component of type html 'dl' element. */
// export const dl = () => componentOld('dl');
// /** Create a component of type html 'dt' element. */
// export const dt = () => componentOld('dt');
// /** Create a component of type html 'em' element. */
// export const em = () => componentOld('em');
// /** Create a component of type html 'embed' element. */
// export const embed = () => componentOld('embed');
// /** Create a component of type html 'fieldset' element. */
// export const fieldset = () => componentOld('fieldset');
// /** Create a component of type html 'figcaption' element. */
// export const figcaption = () => componentOld('figcaption');
// /** Create a component of type html 'figure' element. */
// export const figure = () => componentOld('figure');
// /** Create a component of type html 'font' element. */
// export const font = () => componentOld('font');
// /** Create a component of type html 'footer' element. */
// export const footer = () => componentOld('footer');
// /** Create a component of type html 'form' element. */
// export const form = () => componentOld('form');
// /** Create a component of type html 'frame' element. */
// export const frame = () => componentOld('frame');
// /** Create a component of type html 'frameset' element. */
// export const frameset = () => componentOld('frameset');
// /** Create a component of type html 'h1' element. */
// export const h1 = () => componentOld('h1');
// /** Create a component of type html 'h2' element. */
// export const h2 = () => componentOld('h2');
// /** Create a component of type html 'h3' element. */
// export const h3 = () => componentOld('h3');
// /** Create a component of type html 'h4' element. */
// export const h4 = () => componentOld('h4');
// /** Create a component of type html 'h5' element. */
// export const h5 = () => componentOld('h5');
// /** Create a component of type html 'h6' element. */
// export const h6 = () => componentOld('h6');
// /** Create a component of type html 'head' element. */
// export const head = () => componentOld('head');
// /** Create a component of type html 'header' element. */
// export const header = () => componentOld('header');
// /** Create a component of type html 'hgroup' element. */
// export const hgroup = () => componentOld('hgroup');
// /** Create a component of type html 'hr' element. */
// export const hr = () => componentOld('hr');
// /** Create a component of type html 'html' element. */
// export const html = () => componentOld('html');
// /** Create a component of type html 'i' element. */
// export const i = () => componentOld('i');
// /** Create a component of type html 'iframe' element. */
// export const iframe = () => componentOld('iframe');
// /** Create a component of type html 'img' element. */
// export const img = () => componentOld('img');
// /** Create a component of type html 'input' element. */
// export const input = () => componentOld('input');
// /** Create a component of type html 'ins' element. */
// export const ins = () => componentOld('ins');
// /** Create a component of type html 'kbd' element. */
// export const kbd = () => componentOld('kbd');
// /** Create a component of type html 'label' element. */
// export const label = () => componentOld('label');
// /** Create a component of type html 'legend' element. */
// export const legend = () => componentOld('legend');
// /** Create a component of type html 'li' element. */
// export const li = () => componentOld('li');
// /** Create a component of type html 'link' element. */
// export const link = () => componentOld('link');
// /** Create a component of type html 'main' element. */
// export const main = () => componentOld('main');
// /** Create a component of type html 'map' element. */
// export const map = () => componentOld('map');
// /** Create a component of type html 'mark' element. */
// export const mark = () => componentOld('mark');
// /** Create a component of type html 'marquee' element. */
// export const marquee = () => componentOld('marquee');
// /** Create a component of type html 'menu' element. */
// export const menu = () => componentOld('menu');
// /** Create a component of type html 'meta' element. */
// export const meta = () => componentOld('meta');
// /** Create a component of type html 'meter' element. */
// export const meter = () => componentOld('meter');
// /** Create a component of type html 'nav' element. */
// export const nav = () => componentOld('nav');
// /** Create a component of type html 'noscript' element. */
// export const noscript = () => componentOld('noscript');
// /** Create a component of type html 'object' element. */
// export const object = () => componentOld('object');
// /** Create a component of type html 'ol' element. */
// export const ol = () => componentOld('ol');
// /** Create a component of type html 'optgroup' element. */
// export const optgroup = () => componentOld('optgroup');
// /** Create a component of type html 'option' element. */
// export const option = () => componentOld('option');
// /** Create a component of type html 'output' element. */
// export const output = () => componentOld('output');
// /** Create a component of type html 'p' element. */
// export const p = () => componentOld('p');
// /** Create a component of type html 'param' element. */
// export const param = () => componentOld('param');
// /** Create a component of type html 'picture' element. */
// export const picture = () => componentOld('picture');
// /** Create a component of type html 'pre' element. */
// export const pre = () => componentOld('pre');
// /** Create a component of type html 'progress' element. */
// export const progress = () => componentOld('progress');
// /** Create a component of type html 'q' element. */
// export const q = () => componentOld('q');
// /** Create a component of type html 'rp' element. */
// export const rp = () => componentOld('rp');
// /** Create a component of type html 'rt' element. */
// export const rt = () => componentOld('rt');
// /** Create a component of type html 'ruby' element. */
// export const ruby = () => componentOld('ruby');
// /** Create a component of type html 's' element. */
// export const s = () => componentOld('s');
// /** Create a component of type html 'samp' element. */
// export const samp = () => componentOld('samp');
// /** Create a component of type html 'script' element. */
// export const script = () => componentOld('script');
// /** Create a component of type html 'section' element. */
// export const section = () => componentOld('section');
// /** Create a component of type html 'select' element. */
// export const Select = () => componentOld('select');
// /** Create a component of type html 'slot' element. */
// export const slot = () => componentOld('slot');
// /** Create a component of type html 'small' element. */
// export const small = () => componentOld('small');
// /** Create a component of type html 'source' element. */
// export const source = () => componentOld('source');
// /** Create a component of type html 'span' element. */
// export const span = () => componentOld('span');
// /** Create a component of type html 'strong' element. */
// export const strong = () => componentOld('strong');
// /** Create a component of type html 'style' element. */
// export const style = () => componentOld('style');
// /** Create a component of type html 'sub' element. */
// export const sub = () => componentOld('sub');
// /** Create a component of type html 'summary' element. */
// export const summary = () => componentOld('summary');
// /** Create a component of type html 'sup' element. */
// export const sup = () => componentOld('sup');
// /** Create a component of type html 'table' element. */
// export const table = () => componentOld('table');
// /** Create a component of type html 'tbody' element. */
// export const tbody = () => componentOld('tbody');
// /** Create a component of type html 'td' element. */
// export const td = () => componentOld('td');
// /** Create a component of type html 'template' element. */
// export const template = () => componentOld('template');
// /** Create a component of type html 'textarea' element. */
// export const textarea = () => componentOld('textarea');
// /** Create a component of type html 'tfoot' element. */
// export const tfoot = () => componentOld('tfoot');
// /** Create a component of type html 'th' element. */
// export const th = () => componentOld('th');
// /** Create a component of type html 'thead' element. */
// export const thead = () => componentOld('thead');
// /** Create a component of type html 'time' element. */
// export const time = () => componentOld('time');
// /** Create a component of type html 'title' element. */
// export const title = () => componentOld('title');
// /** Create a component of type html 'tr' element. */
// export const tr = () => componentOld('tr');
// /** Create a component of type html 'track' element. */
// export const track = () => componentOld('track');
// /** Create a component of type html 'u' element. */
// export const u = () => componentOld('u');
// /** Create a component of type html 'ul' element. */
// export const ul = () => componentOld('ul');
// /** Create a component of type html 'Var' element. */
// export const Var = () => componentOld('var');
// /** Create a component of type html 'video' element. */
// export const video = () => componentOld('video');
// /** Create a component of type html 'wbr' element. */
// export const wbr = () => componentOld('wbr');
