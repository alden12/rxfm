# Changelog

All notable changes to `@reactive-ts/core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-29

### Added

- First real release (replacing the reserved `0.0.0` placeholder).
- `transformWithMappings(ts, source, baseDir)` — the Reactive TS transform: compiles `.rts`
  (imperative-looking observable code) to real, fully-typed RxJS, returning the generated code plus
  source↔generated position mappings and diagnostics.
- `@reactive-ts/core/vite` — the `reactiveTs()` Vite plugin, which compiles `.rts` modules in a Vite
  build using the same transform (so what runs matches what the editor types show), while leaving
  `?raw` / `?url` / `?inline` imports to Vite core.
