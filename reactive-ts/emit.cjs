#!/usr/bin/env node
// Emit the generated TypeScript for a `.rts` file to stdout — the exact output of
// the same `transformWithMappings` that powers the editor live-types, the Vite
// build, and the fixture suite. Handy for eyeballing what an imperative `.rts`
// expression actually compiles to (cold-vs-shared sources, combineLatest vs map,
// switchMap filter idioms, …).
//
//   yarn reactive-ts:emit examples/snake-game/game.rts
//
// The transform builds its own program anchored at the file's directory, so the
// file's imports (rxjs, ../runtime, ./constants, …) resolve from disk exactly as
// they do in the editor. Requires the transform to be built — the `reactive-ts:emit`
// yarn script runs `build:reactive-ts` first.
"use strict";
const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const { transformWithMappings } = require("./ts-plugin/transform.cjs");

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: yarn reactive-ts:emit <file.rts>");
  process.exit(1);
}

const file = path.resolve(arg);
const source = fs.readFileSync(file, "utf8");
const { code } = transformWithMappings(ts, source, path.dirname(file));
process.stdout.write(code.endsWith("\n") ? code : code + "\n");
