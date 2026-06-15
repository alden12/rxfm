// Volar LanguagePlugin for .rts files.
//
// Tells Volar: ".rts is a language; here is its embedded TypeScript and the
// position mappings." Volar feeds the embedded TS to tsserver, which type-checks
// it with full project context, and maps hovers/errors back through `mappings`.
//
// Pure factory (no Volar import — returns plain objects matching Volar's shape),
// so it can be exercised headlessly. `ts` is injected by the caller.
"use strict";
import type * as TS from "typescript";
import type { Ts } from "./transform-types.cjs";
import { transformWithMappings, segmentsToVolarMappings } from "./transform.cjs";
const path = require("node:path");

const uriPath = (uri: any): string => (typeof uri === "string" ? uri : uri.path || uri.fsPath || String(uri));
const normPath = (p: any): string => uriPath(p).replace(/^file:\/\//, "");

// The latest transform result per .rts path, computed from the ORIGINAL source
// (the snapshot Volar hands createVirtualCode). The tsserver-plugin diagnostics
// layer (index.cjs) reuses this to surface transform-emitted warnings (stalls,
// higher-order lifts): it can't re-derive them from the host, whose snapshot for a
// .rts path is the GENERATED TS (what tsserver analyses), not the source.
// Module-level so both halves of the plugin share one map. Stores the original
// `text` too, for building a source file when there are no existing diagnostics.
const transformResults = new Map();
export const getTransformResult = (fileName: string) => transformResults.get(normPath(fileName));

export function createReactiveTsLanguagePlugin(ts: Ts) {
  // Cache by source text so we don't rebuild a Program when nothing changed.
  const cache = new Map();
  const compile = (filePath: string, text: string) => {
    const hit = cache.get(filePath);
    if (hit && hit.text === text) return hit.result;
    const result = transformWithMappings(ts, text, path.dirname(filePath));
    cache.set(filePath, { text, result });
    return result;
  };

  const makeVirtualCode = (filePath: string, snapshot: TS.IScriptSnapshot) => {
    const text = snapshot.getText(0, snapshot.getLength());
    const result = compile(filePath, text);
    const { code, segments } = result;
    transformResults.set(normPath(filePath), { text, result });
    return {
      id: "root",
      languageId: "typescript",
      snapshot: {
        getText: (start: number, end: number) => code.slice(start, end),
        getLength: () => code.length,
        getChangeRange: () => undefined,
      },
      mappings: segmentsToVolarMappings(segments),
      embeddedCodes: [],
    };
  };

  return {
    getLanguageId(uri: any) {
      if (uriPath(uri).endsWith(".rts")) return "rts";
      return undefined;
    },
    createVirtualCode(uri: any, languageId: string, snapshot: TS.IScriptSnapshot) {
      if (languageId !== "rts") return undefined;
      return makeVirtualCode(uriPath(uri), snapshot);
    },
    updateVirtualCode(uri: any, _oldCode: any, newSnapshot: TS.IScriptSnapshot) {
      return makeVirtualCode(uriPath(uri), newSnapshot);
    },
    typescript: {
      extraFileExtensions: [
        { extension: "rts", isMixedContent: false, scriptKind: ts.ScriptKind.Deferred },
      ],
      // Let a bare `import … from './game'` resolve to a sibling `./game.rts`: TS
      // probes for `./game.d.ts`, and Volar remaps that to the .rts's virtual TS.
      // This is the editor-side half of cross-.rts imports (the transform's own
      // inference Program resolves them separately in transform.cjs).
      resolveHiddenExtensions: true,
      // Our whole file maps to one TS document, so the root virtual code IS the
      // script tsserver should analyse.
      getServiceScript(rootVirtualCode: any) {
        return { code: rootVirtualCode, extension: ".ts", scriptKind: ts.ScriptKind.TS };
      },
    },
  };
}
