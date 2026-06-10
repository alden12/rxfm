// Markdown + source-code rendering for the demo doc-site. Plain `.ts` (not `.rts`):
// ordinary string/DOM code with no reactive expressions to lift. Markdown and
// highlighted source are rendered to an HTML string, dropped into a detached element,
// and handed to RxFM as a one-shot component (`Observable<HTMLElement>`).
//
// The custom `code` renderer is the seam that makes the docs "read the same way" as
// the README: a fence annotated `demo=<id>` (e.g. ```ts demo=counter) renders its code
// exactly as on GitHub, then emits an HTML-comment marker the doc-page composer splits
// on to interleave a live demo. The annotation is inert in static markdown — GitHub
// uses the first word (`ts`) as the language and ignores the rest.
//
// `highlight.js/lib/core` + per-language registration keeps the bundle small (the full
// `highlight.js` registers ~190 languages). `.rts` highlights as TypeScript — it is.
import { Observable, defer, of } from 'rxjs';
import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import 'highlight.js/styles/github.css';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);

// Code-fence languages used across the docs, normalised to a registered highlight.js
// language. Anything unknown (or a bare fence) falls back to TypeScript, which is what
// nearly every snippet in these docs is.
const LANGUAGE_ALIASES: Record<string, string> = {
  '': 'typescript',
  rts: 'typescript',
  ts: 'typescript',
  tsx: 'typescript',
  js: 'typescript',
  typescript: 'typescript',
  html: 'xml',
  css: 'css',
  bash: 'bash',
  sh: 'bash',
  json: 'json',
};

const resolveLanguage = (lang: string): string =>
  LANGUAGE_ALIASES[lang] ?? (hljs.getLanguage(lang) ? lang : 'typescript');

const highlight = (source: string, lang: string): string =>
  hljs.highlight(source, { language: resolveLanguage(lang) }).value;

/** Marker emitted after a `demo=<id>` fence; the doc-page composer splits on it. */
const demoMarker = (id: string): string => `<!--rxfm-demo:${id}-->`;

/** Matches {@link demoMarker} output; `g`-less so it works as a split delimiter capture. */
export const DEMO_MARKER = /<!--rxfm-demo:([\w-]+)-->/;

const marked = new Marked({
  renderer: {
    code({ text, lang }) {
      const [language = '', ...annotations] = (lang ?? '').trim().split(/\s+/);
      const demo = annotations.join(' ').match(/demo=([\w-]+)/);
      const pre = `<pre class="hljs code-block not-prose"><code>${highlight(text, language)}</code></pre>`;
      return demo ? pre + demoMarker(demo[1]) : pre;
    },
  },
});

/**
 * Wrap a raw HTML string as a one-shot RxFM component. `defer` so each subscription
 * gets a fresh element (RxFM swaps elements by reference at the root).
 */
export const rawHtml = (html: string, className?: string): Observable<HTMLElement> =>
  defer(() => {
    const element = document.createElement('div');
    if (className) element.className = className;
    element.innerHTML = html;
    return of(element);
  });

/** Render markdown to an HTML string (with {@link DEMO_MARKER}s for `demo=` fences). */
export const renderMarkdownHtml = (markdown: string): string =>
  marked.parse(markdown, { async: false }) as string;

/** Render highlighted source code (defaults to TypeScript, which covers `.rts`). */
export const codeBlock = (source: string, lang = 'typescript'): Observable<HTMLElement> =>
  rawHtml(`<pre class="hljs code-block not-prose"><code>${highlight(source.trim(), lang)}</code></pre>`);
