// src/data/customDecks.ts
// Single owner of custom-deck types, storage and — crucially — the conversion
// of custom cards into playable Challenge objects. Previously DeckSelectScreen
// and DecksScreen each declared their own copies, and custom decks never made
// it into the game pool at all (empty pool → crash in GameScreen).
//
// Migration: update DecksScreen / CardsScreen / DeckSelectScreen to import
// CustomDeck, CustomCard, loadCustomDecks, saveCustomDecks, loadCustomCards,
// saveCustomCards from here and delete their local duplicates.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge } from './gameData';

// NOTE: legacy keys kept so existing users' decks survive the update.
// If you rename them for the Sip Happens brand, write a one-time migration.
const DECKS_KEY = '@nekkit_custom_decks';
const CARDS_KEY = '@nekkit_custom_cards';

export interface CustomCard {
  id: string;
  text: string;
  action: string;
  createdAt: number;
}

export interface CustomDeck {
  id: string;
  name: string;
  icon: string;
  color: string;
  cardIds: string[];
  createdAt: number;
}

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

/**
 * Resolve the selected custom decks into Challenge objects the card engine
 * can draw from. Ids are namespaced (`custom-…`) so they can never collide
 * with built-in card ids in the used-card sets.
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
      const card = cardById.get(cardId);
      if (!card) continue; // card deleted after the deck referenced it
      seen.add(cardId);
      pool.push({
        id: `custom-${card.id}`,
        text: card.text,
        action: card.action || 'Do it',
        icon: 'sparkles' as const,
        intensity: 2,
        mode: 'custom',
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