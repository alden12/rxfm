// tsserver plugin entry. VS Code's built-in TypeScript loads this (declared via
// the companion extension's `typescriptServerPlugins` contribution), giving
// .rts files real hover / errors / go-to-def mapped through our transform.
//
// `@volar/typescript` turns our Volar LanguagePlugin into a tsserver plugin.
"use strict";
import type { Ts } from "./transform-types.cjs";
import { createReactiveTsLanguagePlugin, getTransformResult } from "./language-plugin.cjs";
import { rewriteBoundaryDiagnostic } from "./boundary-diagnostics.cjs";
import { transformWithMappings } from "./transform.cjs";
const path = require("node:path");
// The quickstart helper isn't re-exported from the package root in Volar 2.4, so
// require it by subpath. (Volar is external/untyped here — tsserver injects it.)
const { createLanguageServicePlugin } = require("@volar/typescript/lib/quickstart/createLanguageServicePlugin.js");

// The transform result for a .rts, computed from its ORIGINAL source. Prefer the
// one the Volar LanguagePlugin already built (keyed by path) — the host's snapshot
// for a .rts path is the GENERATED TS, so re-transforming it would find none of the
// source-level patterns these warnings key off. Falls back to transforming the
// snapshot directly (the headless harnesses' mock host serves the real source).
function reactiveTsTransformFor(ts: Ts, info: any, fileName: string) {
  const cached = getTransformResult(fileName);
  if (cached) return cached;
  const snapshot = info.languageServiceHost.getScriptSnapshot(fileName);
  if (!snapshot) return undefined;
  const text = snapshot.getText(0, snapshot.getLength());
  return { text, result: transformWithMappings(ts, text, path.dirname(fileName)) };
}

// Reactive TS-originated warnings (not rewrites of TS errors): a binding produced by the
// `cond ? x : EMPTY` filter idiom can be empty, so combining it with combineLatest
// stalls until it first emits. The transform reports those spans; surface each as a
// warning on the .rts source.
function stallDiagnostics(ts: Ts, info: any, fileName: string, existingFile?: any) {
  try {
    const transformed = reactiveTsTransformFor(ts, info, fileName);
    if (!transformed) return [];
    const { text, result: { stalls } } = transformed;
    if (!stalls || !stalls.length) return [];
    const file = existingFile || ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
    return stalls.map((s: any) => ({
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

// Reactive TS-originated warning: lifting a call whose function itself returns an observable
// (e.g. `timer(0, period)` over an observable period) makes a stream-of-streams
// (Observable<Observable<…>>) that never flattens, so it won't behave as one reactive
// value. It type-checks — TS stays silent — so the transform reports the span and we
// surface it here, pointing at a flattening helper.
function higherOrderDiagnostics(ts: Ts, info: any, fileName: string, existingFile?: any) {
  try {
    const transformed = reactiveTsTransformFor(ts, info, fileName);
    if (!transformed) return [];
    const { text, result: { higherOrder } } = transformed;
    if (!higherOrder || !higherOrder.length) return [];
    const file = existingFile || ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
    return higherOrder.map((h: any) => ({
      file,
      start: h.start,
      length: h.length,
      category: ts.DiagnosticCategory.Warning,
      code: 9002,
      messageText:
        `${h.name ? `'${h.name}'` : "This call"} returns a stream, so lifting it over an ` +
        `observable argument makes a stream-of-streams (Observable<Observable<…>>) that never ` +
        `flattens — it won't behave as a single reactive value. Use a helper that flattens with ` +
        `switchMap (e.g. \`interval(period)\` for a clock whose rate can change), or write the ` +
        `\`switchMap\` explicitly.`,
    }));
  } catch {
    return [];
  }
}

// The stream operators offered in .rts member completion on an observable receiver.
// Exactly the transform's pass-through set (transform.cts OPERATOR_METHODS) — the ones
// that behave as real stream operators in .rts. map/filter/flatMap are omitted: in .rts
// those are the mapToComponents / element-filter / C1 paths, so offering them as stream
// operators would mislead.
const OBSERVABLE_OPERATOR_COMPLETIONS = [
  "scan", "take", "drop", "takeUntil", "catch", "finally", "debounce", "throttle",
];

// In a .rts file, `stream.field` lifts to `stream.pipe(map(s => s.field))`, so TS resolves
// completion at `stream.|` against the EMITTED VALUE (e.g. string members) and the stream's
// own operator methods never enter the list. When the cursor sits in a recorded
// observable-member span (the transform reports them), merge those operators back in — on
// top of the emitted-value members, which stay useful for field extraction.
function augmentObservableOperatorCompletions(ts: Ts, info: any, fileName: string, position: number, result: any) {
  try {
    const transformed = reactiveTsTransformFor(ts, info, fileName);
    const members = transformed && (transformed.result as any).observableMembers;
    if (!members || !members.some((m: any) => position > m.start && position <= m.start + m.length)) {
      return result;
    }
    const existing = result ? result.entries : [];
    const have = new Set(existing.map((e: any) => e.name));
    const opEntries = OBSERVABLE_OPERATOR_COMPLETIONS.filter(n => !have.has(n)).map(name => ({
      name,
      kind: ts.ScriptElementKind.memberFunctionElement,
      kindModifiers: "",
      // Sort ahead of the emitted-value members (TS gives those sortText '11'), so the
      // operators are prominent at the top of the list for any observable rather than
      // buried below dozens of value members.
      sortText: `10_${name}`,
      labelDetails: { description: "stream operator" },
    }));
    if (!opEntries.length) return result;
    if (!result) {
      return { isGlobalCompletion: false, isMemberCompletion: true, isNewIdentifierLocation: false, entries: opEntries };
    }
    return { ...result, entries: [...existing, ...opEntries] };
  } catch {
    return result;
  }
}

const base = createLanguageServicePlugin((ts: Ts /*, info */) => ({
  languagePlugins: [createReactiveTsLanguagePlugin(ts)],
}));

// Hosts whose module resolution we've already augmented (create() can run once
// per project; don't stack wrappers).
const reactiveTsResolutionPatched = new WeakSet();

// Resolve a bare relative import (`./game`, `../engine`) to a sibling .rts file.
// Returns the resolved-module shape TS expects, served as `.ts` (Volar's
// getServiceScript maps .rts virtual code to .ts), or undefined if no such file.
function resolveReactiveTsSibling(ts: Ts, containingFile: string, specifier: string) {
  if (!specifier.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(containingFile), specifier);
  const candidate = [base + ".rts", path.join(base, "index.rts")].find((f: string) => ts.sys.fileExists(f));
  if (!candidate) return undefined;
  return { resolvedFileName: candidate, extension: ".ts", isExternalLibraryImport: false };
}

// Volar's own cross-.rts resolution (resolveHiddenExtensions) only kicks in when a
// file already imports something with a literal `.rts` suffix; a plain `./game`
// specifier falls through to stock TS resolution, which doesn't know .rts — so the
// editor reports "Cannot find module './game'". Layer a fallback over the
// (Volar-decorated) host that resolves those leftover relative imports to sibling
// .rts files, so a reactive "engine" module and its view can live in separate files.
function patchReactiveTsModuleResolution(ts: Ts, languageServiceHost: any) {
  if (reactiveTsResolutionPatched.has(languageServiceHost)) return;
  reactiveTsResolutionPatched.add(languageServiceHost);
  const resolveLiterals = languageServiceHost.resolveModuleNameLiterals?.bind(languageServiceHost);
  if (resolveLiterals) {
    languageServiceHost.resolveModuleNameLiterals = (literals: any, containingFile: string, ...rest: any[]) => {
      const resolved = resolveLiterals(literals, containingFile, ...rest);
      return resolved.map((result: any, i: number) => {
        if (result.resolvedModule) return result;
        const sibling = resolveReactiveTsSibling(ts, containingFile, literals[i].text);
        return sibling ? { resolvedModule: sibling } : result;
      });
    };
  }
  const resolveNames = languageServiceHost.resolveModuleNames?.bind(languageServiceHost);
  if (resolveNames) {
    languageServiceHost.resolveModuleNames = (names: string[], containingFile: string, ...rest: any[]) => {
      const resolved = resolveNames(names, containingFile, ...rest);
      return resolved.map((module: any, i: number) => module || resolveReactiveTsSibling(ts, containingFile, names[i]));
    };
  }
}

// Wrap Volar's decorated language service so semantic errors on .rts files get
// the teaching-message treatment for boundary violations, and so .rts completions
// offer auto-imports. Volar's service is a JS Proxy, so we delegate everything
// through a Proxy of our own and override only `getSemanticDiagnostics` and
// `getCompletionsAtPosition`. (TS language-service methods are closures, not
// `this`-bound, so forwarding `target[p]` is safe.)
module.exports = (modules: any) => {
  const pluginModule = base(modules);
  const ts: Ts = modules.typescript;
  const originalCreate = pluginModule.create;
  pluginModule.create = (info: any) => {
    const languageService = originalCreate(info);
    // originalCreate() has now let Volar decorate the host's module resolution;
    // layer our sibling-.rts fallback on top of it.
    patchReactiveTsModuleResolution(ts, info.languageServiceHost);
    return new Proxy(languageService, {
      get(target: any, prop: string | symbol) {
        if (prop === "getSemanticDiagnostics") {
          return (fileName: string, ...rest: any[]) => {
            const diagnostics = target.getSemanticDiagnostics(fileName, ...rest);
            if (typeof fileName !== "string" || !fileName.endsWith(".rts")) return diagnostics;
            const rewritten = diagnostics.map((d: any) => rewriteBoundaryDiagnostic(ts, d) || d);
            const existing = rewritten[0] && rewritten[0].file;
            return rewritten
              .concat(stallDiagnostics(ts, info, fileName, existing))
              .concat(higherOrderDiagnostics(ts, info, fileName, existing));
          };
        }
        // Auto-imports: TS only returns module-export (auto-import) completions when
        // `includeCompletionsForModuleExports` is set. VS Code's built-in TypeScript
        // extension keys that preference off the `typescript`/`javascript` language
        // ids and so never sends it for our custom `rts` language — so typing an
        // unimported `Div`/`timer`/… offered no "add import" entry. Force it on (with
        // insert-text, which auto-import entries need) for .rts requests, merging so
        // VS Code's other preferences are preserved. Safe: it only enables suggestions.
        if (prop === "getCompletionsAtPosition") {
          return (fileName: string, position: number, options: any, formattingSettings: any) => {
            const isRts = typeof fileName === "string" && fileName.endsWith(".rts");
            const opts = isRts
              ? { ...options, includeCompletionsForModuleExports: true, includeCompletionsWithInsertText: true }
              : options;
            const result = target.getCompletionsAtPosition(fileName, position, opts, formattingSettings);
            return isRts ? augmentObservableOperatorCompletions(ts, info, fileName, position, result) : result;
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
// Exposed for headless testing of the higher-order-lift warning surfacing.
module.exports.higherOrderDiagnostics = higherOrderDiagnostics;
// Exposed for headless testing of the observable-operator completion augmentation.
module.exports.augmentObservableOperatorCompletions = augmentObservableOperatorCompletions;
// Exposed for headless testing of cross-.rts module resolution.
module.exports.patchReactiveTsModuleResolution = patchReactiveTsModuleResolution;
module.exports.resolveReactiveTsSibling = resolveReactiveTsSibling;
