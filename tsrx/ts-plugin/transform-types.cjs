// The tsrx transform's data model — the few shapes that carry almost everything.
// An expression transforms into PIECES; pieces assemble into the generated code
// plus SEGMENTS (the source↔generated position map); standalone EDITS splice
// generated text over source regions. Shared by every transform-* module, so they
// live here (a types-only module — emits an essentially empty .cjs).
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
