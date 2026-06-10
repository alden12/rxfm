// `?raw` imports (Vite) return a module's text as a string. Used by the doc-site to
// pull markdown docs and real `.rts` example source into the app. Covers `*.md?raw`
// and `*.rts?raw` alike (one `*` matches the whole specifier up to the query).
declare module '*?raw' {
  const content: string;
  export default content;
}
