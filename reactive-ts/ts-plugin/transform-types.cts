// The Reactive TS transform's data model — the few shapes that carry almost everything.
// An expression transforms into PIECES; pieces assemble into the generated code
// plus SEGMENTS (the source↔generated position map); standalone EDITS splice
// generated text over source regions. Shared by every transform-* module, so they
// live here (a types-only module — emits an essentially empty .cjs).
'use strict';

// TypeScript is INJECTED at runtime (tsserver hands the plugin its own copy), so we
// only borrow its types at compile time — `import type` is fully erased at emit.
import type * as TS from 'typescript';
/** The TypeScript module shape, as received via the injected `ts` parameter. */
export type Ts = typeof TS;

/** A verbatim slice of the ORIGINAL source carried into the generated code, so the
 *  tokens that survive (identifiers, literals) keep hover / go-to-def 1:1.
 *  `aliasKey` lets a destructured field's declaration site borrow the generated
 *  `item.prop` token its first use produced. */
export interface SrcSlice { srcStart: number; srcEnd: number; aliasKey?: string; }
/** Generated-only text whose position is recorded as a mapping target — the outer
 *  stream reference of a single-root collapse (so the variable hovers as its
 *  `Observable<…>` type, not the in-map value). */
export interface GenPiece { gen: string; refKey?: string; }
/** One fragment of a transformed expression: literal scaffolding (a plain string),
 *  a surviving source slice, or recorded generated text. */
export type Piece = string | SrcSlice | GenPiece;

/** The result of transforming an expression node. */
export interface Operand {
  pieces: Piece[];
  /** Does the expression evaluate to an observable (so a parent must treat it reactively)? */
  observable: boolean;
  /** Did we rewrite it into a stream pipeline (so the binding gets a render() wrap)? */
  lifted: boolean;
  /** An operator-style call left in place but with a lifted ARGUMENT rewritten
   *  (apply the pieces as-is, no render wrap — the call's own result stands). */
  rewritten?: boolean;
  /** Whether the emitted value can be called: false = emits a primitive (so a later
   *  `binding(...)` is a boundary violation to surface), undefined = unknown. */
  callable?: boolean;
  /** The lifted value can be EMPTY (the `cond ? x : EMPTY` filter idiom) → the
   *  binding is flagged maybe-empty so a later combine over it can warn. */
  emptyable?: boolean;
}

/** A destructured stream-item field (D4): alias name → its synthetic stream param
 *  and the property it stands for, scoped to one component-`.map` callback (`cbId`). */
export interface AliasInfo { param: string; prop: string; cbId: number; }

/** A region of source to replace. Either with generated `pieces`, or a single-token
 *  `remap` onto different generated text (`map` → `mapToComponents`). */
export interface Edit { start: number; end: number; pieces?: Piece[]; remap?: string; }

/** A source↔generated position mapping. `identity` = 1:1 (full language features);
 *  a non-identity segment maps a source span onto different generated text —
 *  `navigable` (one token → one token, keeps nav/semantic) or coarse (the default). */
export interface Segment {
  identity: boolean;
  srcStart: number;
  genStart: number;
  length?: number;      // identity: the 1:1 span length
  navigable?: boolean;  // non-identity: token→token remap
  srcLen?: number;      // non-identity: source span length
  genLen?: number;      // non-identity: generated span length
}

export interface Stall { start: number; length: number; name: string; }
export interface HigherOrder { start: number; length: number; name: string | null; }
/** A recorded generated position a later mapping points back at (for hover/nav). */
export interface GenTarget { genStart: number; len: number; }
export interface RootMapping { srcStart: number; len: number; key: string; }
export interface DeclMapping { aliasKey: string; srcStart: number; len: number; }
