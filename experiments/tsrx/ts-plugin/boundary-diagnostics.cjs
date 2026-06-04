// Teaching diagnostics for the imperative/reactive boundary.
//
// The transform compiles imperative observable expressions into real RxJS, so a
// derived binding's TYPE is `RenderObservable<T>` (and raw streams are
// `Observable<T>`). That boundary is what stops you reaching *into* a stream
// synchronously — `sum.toFixed(2)`, `items[0]`, `fn()` on a non-function stream.
// TypeScript already flags those, but with a message that leaks RxJS:
//
//     Property 'toFixed' does not exist on type 'RenderObservable<number>'.
//
// which breaks the "just write imperative code" illusion exactly when you hit the
// wall. This module recognises those boundary violations and rewrites the message
// into one that teaches the fix, keeping the original TS text nested for precision.
'use strict';

// Pull the (Render)Observable type token out of a flattened message. Non-greedy
// up to the `>'` that closes the quoted type, so nested generics
// (`RenderObservable<Array<number>>`) and function types
// (`Observable<(n: number) => string>`) survive intact.
const TYPE_RE = /'((?:Render)?Observable)<([\s\S]+?)>'/;

// Codes that, on a stream type, mean "you used it imperatively where a plain
// value was expected" — i.e. the boundary. Arithmetic/comparison operators are
// NOT here: those get lifted by the transform, so they never reach the editor.
const PROPERTY = 2339; // Property 'X' does not exist on type 'T'.
const NOT_CALLABLE = 2349; // This expression is not callable. Type 'T' has no call signatures.
const NOT_CONSTRUCTABLE = 2351; // This expression is not constructable.
const NOT_INDEXABLE = 7053; // Element implicitly has 'any' … can't be used to index type 'T'.
const BOUNDARY_CODES = new Set([PROPERTY, NOT_CALLABLE, NOT_CONSTRUCTABLE, NOT_INDEXABLE]);

const labelFor = kind => (kind === 'RenderObservable' ? 'a reactive value' : 'a stream');

// Build the teaching headline for a boundary violation, or null if this isn't one.
function teachingHeadline(flat, code, kind, inner) {
  const label = labelFor(kind);
  const type = `${kind}<${inner}>`;

  if (code === PROPERTY) {
    const prop = /Property '([^']+)' does not exist/.exec(flat);
    const name = prop ? prop[1] : 'that';
    return (
      `'${name}' isn't available here — this is ${label} (${type}), not a ${inner}, ` +
      `so there's no value to read '.${name}' off synchronously. Map over the stream to ` +
      `derive a new reactive value, e.g. \`value.pipe(map(v => v.${name}))\`.`
    );
  }
  if (code === NOT_CALLABLE) {
    return (
      `You're calling ${label} (${type}) directly, but it's a stream of future values, ` +
      `not a function to invoke now. Map over it instead, e.g. ` +
      '`value.pipe(map(v => v(/* … */)))`.'
    );
  }
  if (code === NOT_CONSTRUCTABLE) {
    return (
      `You're using \`new\` on ${label} (${type}), but it's a stream, not a constructor. ` +
      'Construct inside a map instead, e.g. `value.pipe(map(v => new v(/* … */)))`.'
    );
  }
  if (code === NOT_INDEXABLE) {
    return (
      `You're indexing ${label} (${type}) directly, but it has no value to index ` +
      'synchronously. Map over it, e.g. `value.pipe(map(v => v[/* … */]))`.'
    );
  }
  return null;
}

// Wrap whatever `messageText` a diagnostic already has (string or chain) as a
// nested chain entry, so the precise TS text stays visible under the headline.
function asChainEntry(ts, d) {
  if (typeof d.messageText === 'string') {
    return { messageText: d.messageText, category: d.category, code: d.code };
  }
  return d.messageText; // already a DiagnosticMessageChain
}

/**
 * If `diagnostic` is a boundary violation (imperative use of a stream type),
 * return a shallow clone whose `messageText` is a teaching chain. Otherwise
 * return null — caller keeps the original. Pure; safe to unit-test.
 */
function rewriteBoundaryDiagnostic(ts, diagnostic) {
  if (!diagnostic || !BOUNDARY_CODES.has(diagnostic.code)) return null;
  const flat = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  const m = TYPE_RE.exec(flat);
  if (!m) return null;
  const [, kind, inner] = m;
  const headline = teachingHeadline(flat, diagnostic.code, kind, inner);
  if (!headline) return null;
  return {
    ...diagnostic,
    messageText: {
      messageText: headline,
      category: diagnostic.category,
      code: diagnostic.code,
      next: [asChainEntry(ts, diagnostic)],
    },
  };
}

module.exports = { rewriteBoundaryDiagnostic, BOUNDARY_CODES };
