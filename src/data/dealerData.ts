// src/data/dealerData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Drink maths for Screw the Dealer!
//
// The deck itself now lives in ./playingCards.ts, shared with Ring of Fire.
// Those primitives are re-exported here so existing imports (and the smoke
// test) keep working unchanged — this file is the Screw-the-Dealer-specific
// rules layer on top.
//
// Unlike Trivia, this mode does NOT reuse the PENALTY scale. The paper rules
// fix the numbers — 4 drinks, 2 drinks, or the difference — so those are the
// numbers. Sip Intensity is applied additively to the two FIXED dealer
// penalties only; it deliberately does not scale the difference, which is
// already variable and already the harshest number in the app.
//
// No React Native imports here, so tools/dealer-smoke.ts can execute all of it.
// ─────────────────────────────────────────────────────────────────────────────

import { PenaltyContext } from './gameData';
import { RANKS, SUITS, type Card } from './playingCards';

export {
  SUITS, RANKS, SUIT_SYMBOLS, RED_SUITS, DECK_SIZE,
  rankLabel, rankName, isRedSuit, cardName, buildDeck, shuffledDeck,
  remainingByRank,
} from './playingCards';
export type { Suit, Card } from './playingCards';

// ─────────────────────────────────────────────
// RULES
// ─────────────────────────────────────────────

export type Hint = 'higher' | 'lower';

export const STREAK_TO_PASS = 3;

/** Drinks the dealer takes when beaten. Fixed by the rules. */
export const DEALER_PENALTY_FIRST_GUESS = 4;
export const DEALER_PENALTY_SECOND_GUESS = 2;

/**
 * What the dealer must say after a wrong first guess. The app answers this
 * instead of the dealer, so it cannot be a lie.
 */
export function hintFor(guess: number, rank: number): Hint {
  return rank > guess ? 'higher' : 'lower';
}

/**
 * Ranks still possible after a hint. Used to dim the pad for the second guess —
 * the engine still accepts any rank, this is presentation only.
 */
export function possibleRanks(firstGuess: number, hint: Hint): number[] {
  return hint === 'higher'
    ? RANKS.filter(r => r > firstGuess)
    : RANKS.filter(r => r < firstGuess);
}

/** Drinks the dealer owes for being beaten. Sip Intensity applies here. */
export function dealerDrinks(correctOn: 1 | 2, ctx: PenaltyContext = {}): number {
  const base = correctOn === 1
    ? DEALER_PENALTY_FIRST_GUESS
    : DEALER_PENALTY_SECOND_GUESS;
  return base + (ctx.bonus ?? 0);
}

/** The uncapped gap between a guess and the card. */
export function rawDifference(guess: number, rank: number): number {
  return Math.abs(guess - rank);
}

/**
 * Drinks the guesser owes after missing twice: the difference, capped.
 *
 * The cap exists because an Ace guess against a King is 12 drinks in one turn,
 * which is more than any other single penalty in the app by a factor of two.
 * Pass null to play it uncapped.
 */
export function wrongGuessDrinks(
  secondGuess: number,
  rank: number,
  cap: number | null,
): number {
  const diff = rawDifference(secondGuess, rank);
  if (cap == null) return diff;
  return Math.min(diff, cap);
}

// Keep the unused-import checker happy about SUITS/Card being re-exported
// types rather than locals: both are referenced by the re-export block above.
export type DealerCard = Card;
export const SUIT_COUNT = SUITS.length;
