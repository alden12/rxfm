// Composes a rendered markdown doc into an Corrente component, with live demos spliced in
// where the markdown carried a `demo=<id>` fence.
//
// Key design point: the live demos are real Corrente *children*, not elements poked into
// innerHTML with a manual `addToView`. The rendered HTML is split at the demo markers
// into runs of plain HTML, each wrapped as a `rawHtml` component, and the live
// `DemoPanel`s are interleaved between them. Handing the whole sequence to `Div(...)`
// lets Corrente's `children` operator own every subscription — so when the content pane
// swaps pages, the demos' streams (timers, etc.) are torn down with the page instead of
// leaking. (A manual `addToView` into an innerHTML placeholder would not be.)
//
// Styling: Tailwind utilities for the chrome; `prose` (typography plugin) for the
// rendered markdown chunks. Markdown gets bespoke typography, demos sit outside `prose`.
import { Component, ComponentChild, Details, Div, H1, Summary } from 'corrente';
import { DEMOS } from './demos';
import { DEMO_MARKER, codeBlock, rawHtml, renderMarkdownHtml } from './markdown';

const sourceExpander = (source: string): ComponentChild => Details
  .class('border-t border-border')(
    Summary.class('cursor-pointer select-none px-3.5 py-2 text-sm text-muted hover:text-primary-strong')`View full source`,
    codeBlock(source),
  );

const DemoPanel = (id: string): ComponentChild => {
  const demo = DEMOS[id];
  if (!demo) {
    return rawHtml(
      `<div class="not-prose my-5 rounded-lg bg-danger-surface px-4 py-3 text-danger">Unknown demo: <code>${id}</code></div>`,
    );
  }
  return Div.class('my-5 overflow-hidden rounded-lg border border-border')(
    Div.class('border-b border-border bg-surface px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted')`Result`,
    Div.class('demo-result p-4')(demo.component),
    demo.source ? sourceExpander(demo.source) : null,
  );
};

/**
 * Render a markdown string to a doc component, splicing the live demo for each
 * `demo=<id>` fence in just after its code block.
 */
export const DocPage = (markdown: string): Component => {
  // `split` with the single-capture marker regex yields [html, id, html, id, …]:
  // even indices are HTML runs (complete block elements — markers sit after a <pre>),
  // odd indices are demo ids.
  const parts = renderMarkdownHtml(markdown).split(DEMO_MARKER);
  const children = parts.map((part, i) =>
    i % 2 === 0 ? rawHtml(part, 'prose prose-invert max-w-none') : DemoPanel(part),
  );
  return Div.class('mx-auto max-w-[var(--content-width)]')(children);
};

/** A page for a full app example: a heading, the live app, and its source. */
export const AppPage = (title: string, app: ComponentChild, source: string): Component => Div
  .class('mx-auto max-w-[var(--content-width)]')(
    H1.class('mb-4 text-2xl font-bold')`${title}`,
    Div.class('overflow-hidden rounded-lg border border-border')(
      Div.class('demo-result p-4')(app),
      sourceExpander(source),
    ),
  );
