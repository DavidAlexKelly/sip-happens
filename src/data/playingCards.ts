// src/data/playingCards.ts
// ─────────────────────────────────────────────────────────────────────────────
// A standard 52-card deck, shared by every mode that uses playing cards.
//
// These primitives started life inside dealerData.ts, which was fine while
// Screw the Dealer was the only card game. Ring of Fire needs the same deck,
// and a second copy of "what is a King" is exactly how two modes drift apart.
//
// Aces are LOW everywhere: A=1 … 10, J=11, Q=12, K=13. Screw the Dealer needs
// that for its higher/lower maths, and Ring of Fire only cares about rank
// identity, so low aces are harmless there.
//
// No React Native imports, so the smoke tests can execute all of it.
// ─────────────────────────────────────────────────────────────────────────────

import { shuffle } from '../utils/random';

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

/** 1 = Ace (low) … 13 = King. */
export const RANKS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export interface Card {
  rank: number;
  suit: Suit;
  /** Stable within a deck, e.g. "7-hearts". */
  id: string;
}

const RANK_LABELS: Record<number, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

const RANK_NAMES: Record<number, string> = {
  1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '\u2660',
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
};

export const RED_SUITS: Suit[] = ['hearts', 'diamonds'];

export const DECK_SIZE = 52;

/** Short face label for a card corner, e.g. "K". */
export function rankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank);
}

/** Long rank name, e.g. "King". */
export function rankName(rank: number): string {
  return RANK_NAMES[rank] ?? String(rank);
}

export function isRedSuit(suit: Suit): boolean {
  return RED_SUITS.includes(suit);
}

/** Long form for a reveal line, e.g. "Queen of Hearts". */
export function cardName(card: Card): string {
  const suit = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
  return `${rankName(card.rank)} of ${suit}`;
}

/** All 52, in order. Four of every rank. */
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, id: `${rank}-${suit}` });
    }
  }
  return deck;
}

export function shuffledDeck(): Card[] {
  return shuffle(buildDeck());
}

/** How many of each rank are still unseen. */
export function remainingByRank(revealed: Card[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const rank of RANKS) counts[rank] = SUITS.length;
  for (const card of revealed) {
    counts[card.rank] = Math.max(0, (counts[card.rank] ?? 0) - 1);
  }
  return counts;
}
