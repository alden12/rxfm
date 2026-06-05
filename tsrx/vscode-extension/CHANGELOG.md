# Changelog

All notable changes to the tsrx VS Code extension.

## [0.0.3]

### Changed
- Full-bleed extension icon (the gradient tile now fills the whole square) so it
  reads solidly in the Extensions list instead of looking inset.
- The built `.vsix` is now committed to the repo so it can be sideloaded straight
  from a clone.

## [0.0.2]

### Added
- Extension icon (128×128) so tsrx is easy to spot in the Extensions list.

### Fixed
- Lifted bindings showed `const x: any` (with no error) in the installed extension
  while raw types resolved. The transform located the `runtime` module relative to
  the plugin's own folder, which in the bundled extension pointed at a non-existent
  `node_modules/runtime` — so the generated `import { render } from …` was
  unresolvable and every lifted binding collapsed to `any`. The runtime is now
  located by walking up from the `.tsrx` file's own directory.

## [0.0.1]

### Added
- Initial packaged (`.vsix`) build, installable without the Extension Development Host.
- The `tsrx-ts-plugin` tsserver plugin is bundled self-contained (`@volar/typescript`
  inlined, `typescript` left to the host) so the extension ships standalone.
