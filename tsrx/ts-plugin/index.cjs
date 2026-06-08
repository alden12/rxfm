// tsserver plugin entry. VS Code's built-in TypeScript loads this (declared via
// the companion extension's `typescriptServerPlugins` contribution), giving
// .tsrx files real hover / errors / go-to-def mapped through our transform.
//
// `@volar/typescript` turns our Volar LanguagePlugin into a tsserver plugin.
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const language_plugin_cjs_1 = require("./language-plugin.cjs");
const boundary_diagnostics_cjs_1 = require("./boundary-diagnostics.cjs");
const transform_cjs_1 = require("./transform.cjs");
const path = require('node:path');
// The quickstart helper isn't re-exported from the package root in Volar 2.4, so
// require it by subpath. (Volar is external/untyped here — tsserver injects it.)
const { createLanguageServicePlugin } = require('@volar/typescript/lib/quickstart/createLanguageServicePlugin.js');
// The transform result for a .tsrx, computed from its ORIGINAL source. Prefer the
// one the Volar LanguagePlugin already built (keyed by path) — the host's snapshot
// for a .tsrx path is the GENERATED TS, so re-transforming it would find none of the
// source-level patterns these warnings key off. Falls back to transforming the
// snapshot directly (the headless harnesses' mock host serves the real source).
function tsrxTransformFor(ts, info, fileName) {
    const cached = (0, language_plugin_cjs_1.getTransformResult)(fileName);
    if (cached)
        return cached;
    const snapshot = info.languageServiceHost.getScriptSnapshot(fileName);
    if (!snapshot)
        return undefined;
    const text = snapshot.getText(0, snapshot.getLength());
    return { text, result: (0, transform_cjs_1.transformWithMappings)(ts, text, path.dirname(fileName)) };
}
// tsrx-originated warnings (not rewrites of TS errors): a binding produced by the
// `cond ? x : EMPTY` filter idiom can be empty, so combining it with combineLatest
// stalls until it first emits. The transform reports those spans; surface each as a
// warning on the .tsrx source.
function stallDiagnostics(ts, info, fileName, existingFile) {
    try {
        const transformed = tsrxTransformFor(ts, info, fileName);
        if (!transformed)
            return [];
        const { text, result: { stalls } } = transformed;
        if (!stalls || !stalls.length)
            return [];
        const file = existingFile || ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
        return stalls.map((s) => ({
            file,
            start: s.start,
            length: s.length,
            category: ts.DiagnosticCategory.Warning,
            code: 9001,
            messageText: `'${s.name}' can be empty (its \`? : EMPTY\` branch), so combining it here makes the ` +
                `result wait for its first value — it won't emit until then. Provide a fallback value ` +
                `instead of EMPTY, or keep '${s.name}' as a standalone child rather than combining it.`,
        }));
    }
    catch {
        return [];
    }
}
// tsrx-originated warning: lifting a call whose function itself returns an observable
// (e.g. `timer(0, period)` over an observable period) makes a stream-of-streams
// (Observable<Observable<…>>) that never flattens, so it won't behave as one reactive
// value. It type-checks — TS stays silent — so the transform reports the span and we
// surface it here, pointing at a flattening helper.
function higherOrderDiagnostics(ts, info, fileName, existingFile) {
    try {
        const transformed = tsrxTransformFor(ts, info, fileName);
        if (!transformed)
            return [];
        const { text, result: { higherOrder } } = transformed;
        if (!higherOrder || !higherOrder.length)
            return [];
        const file = existingFile || ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
        return higherOrder.map((h) => ({
            file,
            start: h.start,
            length: h.length,
            category: ts.DiagnosticCategory.Warning,
            code: 9002,
            messageText: `${h.name ? `'${h.name}'` : 'This call'} returns a stream, so lifting it over an ` +
                `observable argument makes a stream-of-streams (Observable<Observable<…>>) that never ` +
                `flattens — it won't behave as a single reactive value. Use a helper that flattens with ` +
                `switchMap (e.g. \`interval(period)\` for a clock whose rate can change), or write the ` +
                `\`switchMap\` explicitly.`,
        }));
    }
    catch {
        return [];
    }
}
const base = createLanguageServicePlugin((ts /*, info */) => ({
    languagePlugins: [(0, language_plugin_cjs_1.createTsrxLanguagePlugin)(ts)],
}));
// Hosts whose module resolution we've already augmented (create() can run once
// per project; don't stack wrappers).
const tsrxResolutionPatched = new WeakSet();
// Resolve a bare relative import (`./game`, `../engine`) to a sibling .tsrx file.
// Returns the resolved-module shape TS expects, served as `.ts` (Volar's
// getServiceScript maps .tsrx virtual code to .ts), or undefined if no such file.
function resolveTsrxSibling(ts, containingFile, specifier) {
    if (!specifier.startsWith('.'))
        return undefined;
    const base = path.resolve(path.dirname(containingFile), specifier);
    const candidate = [base + '.tsrx', path.join(base, 'index.tsrx')].find((f) => ts.sys.fileExists(f));
    if (!candidate)
        return undefined;
    return { resolvedFileName: candidate, extension: '.ts', isExternalLibraryImport: false };
}
// Volar's own cross-.tsrx resolution (resolveHiddenExtensions) only kicks in when a
// file already imports something with a literal `.tsrx` suffix; a plain `./game`
// specifier falls through to stock TS resolution, which doesn't know .tsrx — so the
// editor reports "Cannot find module './game'". Layer a fallback over the
// (Volar-decorated) host that resolves those leftover relative imports to sibling
// .tsrx files, so a reactive "engine" module and its view can live in separate files.
function patchTsrxModuleResolution(ts, languageServiceHost) {
    if (tsrxResolutionPatched.has(languageServiceHost))
        return;
    tsrxResolutionPatched.add(languageServiceHost);
    const resolveLiterals = languageServiceHost.resolveModuleNameLiterals?.bind(languageServiceHost);
    if (resolveLiterals) {
        languageServiceHost.resolveModuleNameLiterals = (literals, containingFile, ...rest) => {
            const resolved = resolveLiterals(literals, containingFile, ...rest);
            return resolved.map((result, i) => {
                if (result.resolvedModule)
                    return result;
                const sibling = resolveTsrxSibling(ts, containingFile, literals[i].text);
                return sibling ? { resolvedModule: sibling } : result;
            });
        };
    }
    const resolveNames = languageServiceHost.resolveModuleNames?.bind(languageServiceHost);
    if (resolveNames) {
        languageServiceHost.resolveModuleNames = (names, containingFile, ...rest) => {
            const resolved = resolveNames(names, containingFile, ...rest);
            return resolved.map((module, i) => module || resolveTsrxSibling(ts, containingFile, names[i]));
        };
    }
}
// Wrap Volar's decorated language service so semantic errors on .tsrx files get
// the teaching-message treatment for boundary violations. Volar's service is a
// JS Proxy, so we delegate everything through a Proxy of our own and override
// only `getSemanticDiagnostics`. (TS language-service methods are closures, not
// `this`-bound, so forwarding `target[p]` is safe.)
module.exports = (modules) => {
    const pluginModule = base(modules);
    const ts = modules.typescript;
    const originalCreate = pluginModule.create;
    pluginModule.create = (info) => {
        const languageService = originalCreate(info);
        // originalCreate() has now let Volar decorate the host's module resolution;
        // layer our sibling-.tsrx fallback on top of it.
        patchTsrxModuleResolution(ts, info.languageServiceHost);
        return new Proxy(languageService, {
            get(target, prop) {
                if (prop === 'getSemanticDiagnostics') {
                    return (fileName, ...rest) => {
                        const diagnostics = target.getSemanticDiagnostics(fileName, ...rest);
                        if (typeof fileName !== 'string' || !fileName.endsWith('.tsrx'))
                            return diagnostics;
                        const rewritten = diagnostics.map((d) => (0, boundary_diagnostics_cjs_1.rewriteBoundaryDiagnostic)(ts, d) || d);
                        const existing = rewritten[0] && rewritten[0].file;
                        return rewritten
                            .concat(stallDiagnostics(ts, info, fileName, existing))
                            .concat(higherOrderDiagnostics(ts, info, fileName, existing));
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
// Exposed for headless testing of cross-.tsrx module resolution.
module.exports.patchTsrxModuleResolution = patchTsrxModuleResolution;
module.exports.resolveTsrxSibling = resolveTsrxSibling;
