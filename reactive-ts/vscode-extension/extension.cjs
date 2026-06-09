// Extension entry. Activates on `onLanguage:rts`.
//
// VS Code's built-in TypeScript extension only auto-activates for .ts/.js files,
// so opening only a .rts file never wakes it — and our tsserver plugin rides on
// it. Fix: when we activate (a .rts opened), explicitly activate the TS
// extension so it picks up our plugin and starts managing .rts files.
'use strict';
const vscode = require('vscode');

async function activate() {
  const tsExtension = vscode.extensions.getExtension('vscode.typescript-language-features');
  if (tsExtension && !tsExtension.isActive) {
    try {
      await tsExtension.activate();
    } catch {
      /* best effort — if it fails, opening any .ts file still wakes it */
    }
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
