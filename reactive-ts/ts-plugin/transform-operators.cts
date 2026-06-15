// The operators Reactive TS lifts, keyed by SyntaxKind → the source token we re-emit.
// Built from the injected `ts` (SyntaxKind values are only known at runtime).
"use strict";
import type { Ts } from "./transform-types.cjs";

export function operatorTables(ts: Ts): {
  LIFTABLE: Record<number, string>;
  LIFTABLE_UNARY: Record<number, string>;
  LOGICAL: Record<number, string>;
} {
  return {
    // Binary operators we lift eagerly via combineLatest + map. All emit a
    // primitive (number / boolean / string), so the result is never callable.
    // NOTE: short-circuiting operators (&& || ??) are deliberately absent — they
    // get lazy switchMap handling below, like the ternary.
    LIFTABLE: {
      [ts.SyntaxKind.PlusToken]: "+",
      [ts.SyntaxKind.MinusToken]: "-",
      [ts.SyntaxKind.AsteriskToken]: "*",
      [ts.SyntaxKind.SlashToken]: "/",
      [ts.SyntaxKind.PercentToken]: "%",
      [ts.SyntaxKind.AsteriskAsteriskToken]: "**",
      // Comparisons → boolean streams (these feed ternary/logical conditions).
      [ts.SyntaxKind.LessThanToken]: "<",
      [ts.SyntaxKind.GreaterThanToken]: ">",
      [ts.SyntaxKind.LessThanEqualsToken]: "<=",
      [ts.SyntaxKind.GreaterThanEqualsToken]: ">=",
      [ts.SyntaxKind.EqualsEqualsEqualsToken]: "===",
      [ts.SyntaxKind.ExclamationEqualsEqualsToken]: "!==",
      [ts.SyntaxKind.EqualsEqualsToken]: "==",
      [ts.SyntaxKind.ExclamationEqualsToken]: "!=",
      // Bitwise → number streams.
      [ts.SyntaxKind.AmpersandToken]: "&",
      [ts.SyntaxKind.BarToken]: "|",
      [ts.SyntaxKind.CaretToken]: "^",
      [ts.SyntaxKind.LessThanLessThanToken]: "<<",
      [ts.SyntaxKind.GreaterThanGreaterThanToken]: ">>",
      [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: ">>>",
    },
    // Prefix unary operators we lift via map. All emit a primitive.
    LIFTABLE_UNARY: {
      [ts.SyntaxKind.ExclamationToken]: "!",
      [ts.SyntaxKind.MinusToken]: "-",
      [ts.SyntaxKind.PlusToken]: "+",
      [ts.SyntaxKind.TildeToken]: "~",
    },
    // Short-circuiting operators: lifted lazily via switchMap (like the ternary) so
    // the right-hand stream is only subscribed when the left actually selects it.
    LOGICAL: {
      [ts.SyntaxKind.AmpersandAmpersandToken]: "&&",
      [ts.SyntaxKind.BarBarToken]: "||",
      [ts.SyntaxKind.QuestionQuestionToken]: "??",
    },
  };
}
