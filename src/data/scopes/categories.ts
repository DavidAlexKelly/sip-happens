// src/data/scopes/categories.ts
// Categories a user-authored Truth or Dare card can belong to: the five
// built-in mechanics plus a catch-all.
//
// Lives here rather than in customDecks.ts so the scope adapters don't depend
// on the legacy module that packs.ts replaces.

export type CardCategory = 'drink' | 'dare' | 'truth' | 'chaos' | 'spicy' | 'other';

export const CARD_CATEGORIES: CardCategory[] = [
  'drink', 'dare', 'truth', 'chaos', 'spicy', 'other',
];

/**
 * The mode a custom card plays AS in game. One of the built-in five keeps that
 * mechanic's badge and colour; 'other' and legacy cards with no category fall
 * back to 'custom'.
 */
export function playMode(category?: string): string {
  return category && category !== 'other' ? category : 'custom';
}
