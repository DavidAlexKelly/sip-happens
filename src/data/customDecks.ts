// src/data/customDecks.ts
// Single owner of custom-deck types, storage and the conversion of deck
// contents into playable Challenge objects.
//
// NEW: decks can now contain built-in Sip Happens cards. A deck's cardIds
// array holds two kinds of ids:
//   • a CustomCard id            → resolved from the user's card library
//   • "builtin:<challenge id>"   → resolved from ALL_CHALLENGES in gameData
// Old decks (custom ids only) load unchanged — this is backward compatible.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_CHALLENGES, Challenge } from './gameData';

// NOTE: legacy keys kept so existing users' decks survive the update.
const DECKS_KEY = '@nekkit_custom_decks';
const CARDS_KEY = '@nekkit_custom_cards';

/** Categories a custom card can belong to — the built-in five plus a catch-all. */
export type CardCategory = 'drink' | 'dare' | 'truth' | 'chaos' | 'spicy' | 'other';

export const CARD_CATEGORIES: CardCategory[] = ['drink', 'dare', 'truth', 'chaos', 'spicy', 'other'];

export interface CustomCard {
  id: string;
  text: string;
  action: string;
  createdAt: number;
  /** Display title. Legacy cards may lack one — derive via utils/cardTitles. */
  title?: string;
  /** Category. Legacy cards lack one — treated as 'other'. */
  category?: CardCategory;
}

export interface CustomDeck {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** CustomCard ids and/or "builtin:<challenge id>" references. */
  cardIds: string[];
  createdAt: number;
}

// ── Built-in card references ─────────────────────────────────

export const BUILTIN_PREFIX = 'builtin:';

export const builtinRefId = (challengeId: string) => `${BUILTIN_PREFIX}${challengeId}`;
export const isBuiltinRef = (id: string) => id.startsWith(BUILTIN_PREFIX);

const builtinById: Map<string, Challenge> = new Map(
  ALL_CHALLENGES.map(c => [c.id, c]),
);

/** Resolve a builtin ref back to its Challenge (or undefined if unknown). */
export const resolveBuiltinRef = (refId: string): Challenge | undefined =>
  builtinById.get(refId.slice(BUILTIN_PREFIX.length));

// ── Storage ──────────────────────────────────────────────────

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const loadCustomDecks = () => loadJson<CustomDeck[]>(DECKS_KEY, []);
export const loadCustomCards = () => loadJson<CustomCard[]>(CARDS_KEY, []);

export const saveCustomDecks = (decks: CustomDeck[]) =>
  AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));

export const saveCustomCards = (cards: CustomCard[]) =>
  AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));

// ── Pool building ────────────────────────────────────────────

/**
 * Resolve the selected custom decks into Challenge objects the card engine
 * can draw from.
 *   • Custom cards get namespaced ids (`custom-…`) so they never collide with
 *     built-in ids in the used-card sets.
 *   • Built-in references resolve to the ORIGINAL challenge object (same id),
 *     so the engine's dedupe naturally prevents seeing the same card twice
 *     when it's also drawable from a selected built-in deck.
 */
export function buildCustomPool(
  selectedDeckIds: string[],
  decks: CustomDeck[],
  cards: CustomCard[],
): Challenge[] {
  const cardById = new Map(cards.map(c => [c.id, c]));
  const seen = new Set<string>();
  const pool: Challenge[] = [];

  for (const deckId of selectedDeckIds) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) continue;
    for (const cardId of deck.cardIds) {
      if (seen.has(cardId)) continue; // card may appear in several decks
      seen.add(cardId);

      if (isBuiltinRef(cardId)) {
        const challenge = resolveBuiltinRef(cardId);
        if (challenge) pool.push(challenge);
        continue;
      }

      const card = cardById.get(cardId);
      if (!card) continue; // card deleted after the deck referenced it
      // A card categorised as one of the built-in five plays AS that
      // category in-game (badge colour, label); 'other'/legacy → 'custom'.
      const mode = card.category && card.category !== 'other' ? card.category : 'custom';
      pool.push({
        id: `custom-${card.id}`,
        text: card.text,
        action: card.action || 'Do it',
        icon: 'sparkles' as const,
        intensity: 2,
        mode,
      } as Challenge);
    }
  }
  return pool;
}

/** Split a mixed selection into built-in mode ids vs custom deck ids. */
export function splitSelection(
  selected: string[],
  builtInModeIds: string[],
): { modeIds: string[]; customDeckIds: string[] } {
  const builtIn = new Set(builtInModeIds);
  return {
    modeIds: selected.filter(id => builtIn.has(id)),
    customDeckIds: selected.filter(id => !builtIn.has(id)),
  };
}
