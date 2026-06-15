// The Reactive TS runtime now lives in the rxfm library (src/lib/rxfm/runtime.ts) and is
// exported from the package root, so consumers write
// `import { accumulate, interval, EMPTY } from "rxfm"`.
//
// This file stays as the module the transform's generated code imports `render`
// from (it emits a relative specifier resolved by walking up to the nearest
// `runtime.ts`). It re-exports the library runtime via a relative path so it
// resolves in every in-repo seam — including the transform's inference program,
// which deliberately runs without tsconfig `paths` (it can't anchor on a project
// root once the plugin is bundled into the editor extension), so a bare `rxfm`
// specifier wouldn't resolve there.
export * from "../src/lib/rxfm/runtime";
