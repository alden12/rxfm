// tsserver plugin entry. VS Code's built-in TypeScript loads this (declared via
// the companion extension's `typescriptServerPlugins` contribution), giving
// .tsrx files real hover / errors / go-to-def mapped through our transform.
//
// `@volar/typescript` turns our Volar LanguagePlugin into a tsserver plugin.
'use strict';
// The quickstart helper isn't re-exported from the package root in Volar 2.4,
// so require it by subpath.
const path = require('node:path');
const { createLanguageServicePlugin } = require('@volar/typescript/lib/quickstart/createLanguageServicePlugin.js');
const { createTsrxLanguagePlugin } = require('./language-plugin.cjs');
const { rewriteBoundaryDiagnostic } = require('./boundary-diagnostics.cjs');
const { transformWithMappings } = require('./transform.cjs');

// tsrx-originated warnings (not rewrites of TS errors): a binding produced by the
// `cond ? x : EMPTY` filter idiom can be empty, so combining it with combineLatest
// stalls until it first emits. The transform reports those spans; surface each as a
// warning on the .tsrx source.
function stallDiagnostics(ts, info, fileName, existingFile) {
  try {
    const snapshot = info.languageServiceHost.getScriptSnapshot(fileName);
    if (!snapshot) return [];
    const text = snapshot.getText(0, snapshot.getLength());
    const { stalls } = transformWithMappings(ts, text, path.dirname(fileName));
    if (!stalls || !stalls.length) return [];
    const file = existingFile || ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
    return stalls.map(s => ({
      file,
      start: s.start,
      length: s.length,
      category: ts.DiagnosticCategory.Warning,
      code: 9001,
      messageText:
        `'${s.name}' can be empty (its \`? : EMPTY\` branch), so combining it here makes the ` +
        `result wait for its first value — it won't emit until then. Provide a fallback value ` +
        `instead of EMPTY, or keep '${s.name}' as a standalone child rather than combining it.`,
    }));
  } catch {
    return [];
  }
}

const base = createLanguageServicePlugin((ts /*, info */) => ({
  languagePlugins: [createTsrxLanguagePlugin(ts)],
}));

// Wrap Volar's decorated language service so semantic errors on .tsrx files get
// the teaching-message treatment for boundary violations. Volar's service is a
// JS Proxy, so we delegate everything through a Proxy of our own and override
// only `getSemanticDiagnostics`. (TS language-service methods are closures, not
// `this`-bound, so forwarding `target[p]` is safe.)
module.exports = modules => {
  const pluginModule = base(modules);
  const ts = modules.typescript;
  const originalCreate = pluginModule.create;
  pluginModule.create = info => {
    const languageService = originalCreate(info);
    return new Proxy(languageService, {
      get(target, prop) {
        if (prop === 'getSemanticDiagnostics') {
          return (fileName, ...rest) => {
            const diagnostics = target.getSemanticDiagnostics(fileName, ...rest);
            if (typeof fileName !== 'string' || !fileName.endsWith('.tsrx')) return diagnostics;
            const rewritten = diagnostics.map(d => rewriteBoundaryDiagnostic(ts, d) || d);
            return rewritten.concat(stallDiagnostics(ts, info, fileName, rewritten[0] && rewritten[0].file));
          };
        }
        return target[prop];
      },
    });
  };
  return pluginModule;
};

// Exposed for headless testing of the stall-warning surfacing.
module.exports.stallDiagnostics = stallDiagnostics;
