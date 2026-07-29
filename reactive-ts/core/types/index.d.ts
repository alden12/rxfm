import type * as TS from "typescript";

/**
 * The result of compiling a `.rts` source with {@link transformWithMappings}.
 * Most callers only need `code` — the remaining fields are position/diagnostic
 * bookkeeping used by the editor language service.
 */
export interface TransformResult {
  /** Generated TypeScript: the imperative `.rts` expressions lifted into real RxJS. */
  code: string;
  /** Source↔generated position mappings for the editor language service (internal shape). */
  segments: readonly unknown[];
  /** Pre-emit diagnostics reported against the original `.rts` source. */
  sourceDiagnostics: readonly TS.Diagnostic[];
  /** Combine-stall warnings collected during the lift (internal). */
  stalls: readonly unknown[];
  /** Higher-order lift bookkeeping (internal). */
  higherOrder: readonly unknown[];
  /** Observable-member bookkeeping (internal). */
  observableMembers: readonly unknown[];
}

/**
 * Compile Reactive TS (`.rts`) source — imperative-looking observable code — into
 * real, fully-typed RxJS.
 *
 * @param ts The TypeScript module, injected so the caller controls the version
 *   (the transform borrows the checker to learn which identifiers are observables).
 * @param sourceText The raw `.rts` source.
 * @param baseDir Directory the source lives in; anchors module resolution for its
 *   imports (`rxjs`, `corrente`, sibling `./…` files) exactly as the editor sees them.
 */
export declare function transformWithMappings(
  ts: typeof TS,
  sourceText: string,
  baseDir: string,
): TransformResult;
