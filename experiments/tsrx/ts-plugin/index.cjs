// tsserver plugin entry. VS Code's built-in TypeScript loads this (declared via
// the companion extension's `typescriptServerPlugins` contribution), giving
// .tsrx files real hover / errors / go-to-def mapped through our transform.
//
// `@volar/typescript` turns our Volar LanguagePlugin into a tsserver plugin.
'use strict';
// The quickstart helper isn't re-exported from the package root in Volar 2.4,
// so require it by subpath.
const { createLanguageServicePlugin } = require('@volar/typescript/lib/quickstart/createLanguageServicePlugin.js');
const { createTsrxLanguagePlugin } = require('./language-plugin.cjs');
const { rewriteBoundaryDiagnostic } = require('./boundary-diagnostics.cjs');

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
            return diagnostics.map(d => rewriteBoundaryDiagnostic(ts, d) || d);
          };
        }
        return target[prop];
      },
    });
  };
  return pluginModule;
};
