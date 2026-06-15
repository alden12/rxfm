// Full-output check of the Reactive TS Minesweeper, like snake-split.mjs: the generated
// TS of game.rts (engine) + minesweeper.rts (view) is type-checked under the
// editor's tsconfig, with the real plugin fallback resolving the cross-file
// ./game import. Reports the lifted shapes and any genuine output errors.
// Run: node reactive-ts/minesweeper-check.mjs
import ts from "typescript";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import transformCjs from "./ts-plugin/transform.cjs";
import pluginCjs from "./ts-plugin/index.cjs";

const { transformWithMappings } = transformCjs;
const { patchReactiveTsModuleResolution } = pluginCjs;
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'site', 'minesweeper');

const parsed = ts.parseJsonConfigFileContent(
  ts.readConfigFile(join(here, "tsconfig.json"), ts.sys.readFile).config, ts.sys, here,
);
const options = parsed.options;

const enginePath = join(dir, "game.rts");           // resolved via fallback, served as .ts
const viewPath = join(dir, "minesweeper.ts");         // valid program root
const cssShim = join(dir, "__css__.d.ts");
const tx = name => transformWithMappings(ts, readFileSync(join(dir, name), "utf8"), dir).code;
const engineCode = tx("game.rts");
const viewCode = tx("minesweeper.rts");
const virtual = new Map([
  [enginePath, engineCode],
  [viewPath, viewCode],
  [cssShim, "declare module '*.css';\n"],
]);

const host = {
  getScriptFileNames: () => [viewPath, cssShim],
  getScriptVersion: () => "1",
  getScriptKind: f => (f.endsWith(".rts") || virtual.has(f) ? ts.ScriptKind.TS : undefined),
  getScriptSnapshot: f =>
    virtual.has(f) ? ts.ScriptSnapshot.fromString(virtual.get(f))
      : ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f)) : undefined,
  getCurrentDirectory: () => here,
  getCompilationSettings: () => options,
  getDefaultLibFileName: o => ts.getDefaultLibFilePath(o),
  fileExists: f => (virtual.has(f) ? true : ts.sys.fileExists(f)),
  readFile: f => (virtual.has(f) ? virtual.get(f) : ts.sys.readFile(f)),
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};
host.resolveModuleNameLiterals = (literals, containingFile, redirected, opts) =>
  literals.map(lit => ts.resolveModuleName(lit.text, containingFile, opts, host, undefined, redirected));
patchReactiveTsModuleResolution(ts, host);

const ls = ts.createLanguageService(host, ts.createDocumentRegistry());
const prog = ls.getProgram();
const fmt = d => `[${d.code}] ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;

const report = (label, fileName) => {
  const sf = prog.getSourceFile(fileName);
  const diags = [...prog.getSemanticDiagnostics(sf), ...prog.getSyntacticDiagnostics(sf)];
  console.log(`\n=== ${label} (${diags.length} error${diags.length === 1 ? "" : "s"}) ===`);
  for (const d of diags) console.log("  ✘ " + fmt(d));
  return diags.length;
};

// Show key lifted lines from the engine so we can eyeball the transform output.
console.log("--- engine (game.rts) lifted lines ---");
for (const line of engineCode.split("\n")) {
  if (/^export const (board|gameStage|gameTime|highScore)|const (game|startTime|endTime|winTime) /.test(line.trim()))
    console.log("  | " + line.trim());
}

const errs = report("engine output", enginePath) + report("view output", viewPath);
console.log(errs === 0 ? "\n✔ Minesweeper type-checks end-to-end." : `\n✘ ${errs} error(s).`);
process.exit(errs === 0 ? 0 : 1);
