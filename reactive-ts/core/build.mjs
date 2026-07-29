// Build @reactive-ts/core into a publishable dist/.
//
// The transform's canonical TypeScript sources live one level up in ../ts-plugin
// (shared with the tsserver plugin and the headless harnesses). We (1) compile
// them to the CommonJS .cjs artifacts the rest of the repo already builds, then
// (2) esbuild-bundle the two public entry points (the transform and the Vite
// plugin) so the published package is self-contained. `typescript` and `vite`
// stay external — they're peer dependencies the consumer already has.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const tsPlugin = join(here, "..", "ts-plugin");
const dist = join(here, "dist");

// 1. Compile ../ts-plugin/*.cts → *.cjs in place (identical to `yarn build:reactive-ts`).
//    esbuild bundles the transform from these compiled artifacts.
const tscBin = join(here, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
console.log("[core] compiling transform sources (tsc)…");
execFileSync(tscBin, ["-p", join(tsPlugin, "tsconfig.json")], { stdio: "inherit" });

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const common = {
  bundle: true,
  platform: "node",
  target: "node18",
  external: ["typescript", "vite"],
  logLevel: "info",
};

// The transform is authored as CommonJS: it uses `require("node:path")` and the
// `__dirname` global (for a last-resort runtime-path fallback). Neither exists in
// ESM, so the ESM output gets a banner recreating them from import.meta.url —
// esbuild's require shim then delegates to the real `require`, and `__dirname`
// resolves to the package dir (only ever used as a fallback a real consumer, who
// has their own runtime.ts beside their .rts files, never reaches).
const esm = {
  ...common,
  format: "esm",
  banner: {
    js: [
      `import { createRequire as __cr } from "node:module";`,
      `import { fileURLToPath as __ftp } from "node:url";`,
      `import { dirname as __dn } from "node:path";`,
      `const require = __cr(import.meta.url);`,
      `const __filename = __ftp(import.meta.url);`,
      `const __dirname = __dn(__filename);`,
    ].join("\n"),
  },
};
const cjs = { ...common, format: "cjs" };

// 2a. The transform entry (`.`) → dual ESM/CJS.
await build({ ...esm, entryPoints: [join(here, "src/index.ts")], outfile: join(dist, "index.mjs") });
await build({ ...cjs, entryPoints: [join(here, "src/index.ts")], outfile: join(dist, "index.cjs") });

// 2b. The Vite plugin entry (`./vite`) → dual ESM/CJS (bundles the transform in too).
await build({ ...esm, entryPoints: [join(here, "src/vite.ts")], outfile: join(dist, "vite.mjs") });
await build({ ...cjs, entryPoints: [join(here, "src/vite.ts")], outfile: join(dist, "vite.cjs") });

// 3. Hand-authored public type declarations (the transform's internal .cts types
//    aren't part of the published surface).
cpSync(join(here, "types/index.d.ts"), join(dist, "index.d.ts"));
cpSync(join(here, "types/vite.d.ts"), join(dist, "vite.d.ts"));

console.log("[core] built dist/ (index + vite, ESM + CJS + d.ts)");
