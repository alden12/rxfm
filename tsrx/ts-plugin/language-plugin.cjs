// Volar LanguagePlugin for .tsrx files.
//
// Tells Volar: ".tsrx is a language; here is its embedded TypeScript and the
// position mappings." Volar feeds the embedded TS to tsserver, which type-checks
// it with full project context, and maps hovers/errors back through `mappings`.
//
// Pure factory (no Volar import — returns plain objects matching Volar's shape),
// so it can be exercised headlessly. `ts` is injected by the caller.
'use strict';
const path = require('node:path');
const { transformWithMappings, segmentsToVolarMappings } = require('./transform.cjs');

const uriPath = uri => (typeof uri === 'string' ? uri : uri.path || uri.fsPath || String(uri));

function createTsrxLanguagePlugin(ts) {
  // Cache by source text so we don't rebuild a Program when nothing changed.
  const cache = new Map();
  const compile = (filePath, text) => {
    const hit = cache.get(filePath);
    if (hit && hit.text === text) return hit.result;
    const result = transformWithMappings(ts, text, path.dirname(filePath));
    cache.set(filePath, { text, result });
    return result;
  };

  const makeVirtualCode = (filePath, snapshot) => {
    const text = snapshot.getText(0, snapshot.getLength());
    const { code, segments } = compile(filePath, text);
    return {
      id: 'root',
      languageId: 'typescript',
      snapshot: {
        getText: (start, end) => code.slice(start, end),
        getLength: () => code.length,
        getChangeRange: () => undefined,
      },
      mappings: segmentsToVolarMappings(segments),
      embeddedCodes: [],
    };
  };

  return {
    getLanguageId(uri) {
      if (uriPath(uri).endsWith('.tsrx')) return 'tsrx';
      return undefined;
    },
    createVirtualCode(uri, languageId, snapshot) {
      if (languageId !== 'tsrx') return undefined;
      return makeVirtualCode(uriPath(uri), snapshot);
    },
    updateVirtualCode(uri, _oldCode, newSnapshot) {
      return makeVirtualCode(uriPath(uri), newSnapshot);
    },
    typescript: {
      extraFileExtensions: [
        { extension: 'tsrx', isMixedContent: false, scriptKind: ts.ScriptKind.Deferred },
      ],
      // Let a bare `import … from './game'` resolve to a sibling `./game.tsrx`: TS
      // probes for `./game.d.ts`, and Volar remaps that to the .tsrx's virtual TS.
      // This is the editor-side half of cross-.tsrx imports (the transform's own
      // inference Program resolves them separately in transform.cjs).
      resolveHiddenExtensions: true,
      // Our whole file maps to one TS document, so the root virtual code IS the
      // script tsserver should analyse.
      getServiceScript(rootVirtualCode) {
        return { code: rootVirtualCode, extension: '.ts', scriptKind: ts.ScriptKind.TS };
      },
    },
  };
}

module.exports = { createTsrxLanguagePlugin };
