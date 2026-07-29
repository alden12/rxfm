import type { Plugin } from "vite";

/**
 * Vite plugin that compiles `.rts` (Reactive TS) modules to JavaScript using the
 * Reactive TS transform — the same transform that powers the editor types, so what
 * runs matches what you saw typed.
 *
 * Add it to `plugins`, and add `.rts` to `resolve.extensions` for bare cross-file
 * imports. `?raw` / `?url` / `?inline` imports are left to Vite core, so a tool can
 * still import a `.rts` file's own source as text.
 *
 * ```ts
 * import { defineConfig } from "vite";
 * import { reactiveTs } from "@reactive-ts/core/vite";
 *
 * export default defineConfig({
 *   plugins: [reactiveTs()],
 *   resolve: { extensions: [".rts", ".ts", ".js"] },
 * });
 * ```
 */
export declare function reactiveTs(): Plugin;
