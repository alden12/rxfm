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

module.exports = createLanguageServicePlugin((ts /*, info */) => ({
  languagePlugins: [createTsrxLanguagePlugin(ts)],
}));
