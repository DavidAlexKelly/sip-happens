// src/data/packStorage.ts
// Persistence for the shared content library.
//
// Split out from packs.ts so that module can stay pure: importing AsyncStorage
// at the top level makes a module impossible to require outside React Native,
// which defeated the point of having testable migration logic.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CustomItem, LegacyCard, LegacyDeck, Pack, PackScope, TruthOrDarePayload,
  migrateLegacy,
} from './packs';

const itemsKey = (scope: PackScope) => `@siphappens_items_${scope}_v1`;
const packsKey = (scope: PackScope) => `@siphappens_packs_${scope}_v1`;

export const LEGACY_CARDS_KEY = '@nekkit_custom_cards';
export const LEGACY_DECKS_KEY = '@nekkit_custom_decks';
export const MIGRATION_FLAG_KEY = '@siphappens_packs_migrated_v1';

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return Array.isArray(parsed) === Array.isArray(fallback) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export const loadItems = <P>(scope: PackScope) =>
  loadJson<CustomItem<P>[]>(itemsKey(scope), []);

export const loadPacks = (scope: PackScope) =>
  loadJson<Pack[]>(packsKey(scope), []);

export const saveItems = <P>(scope: PackScope, items: CustomItem<P>[]) =>
  AsyncStorage.setItem(itemsKey(scope), JSON.stringify(items));

export const savePacks = (scope: PackScope, packs: Pack[]) =>
  AsyncStorage.setItem(packsKey(scope), JSON.stringify(packs));

/**
 * Run the legacy migration at most once.
 *
 * Deliberately conservative:
 *   • skips if the flag is set
 *   • skips if scoped data already exists, so it can never overwrite newer work
 *   • leaves the legacy keys in place for recovery
 */
export async function runLegacyMigration(): Promise<{ migrated: boolean; items: number; packs: number }> {
  try {
    const done = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (done === 'true') return { migrated: false, items: 0, packs: 0 };

    const existing = await loadPacks('truthOrDare');
    const existingItems = await loadItems('truthOrDare');
    if (existing.length > 0 || existingItems.length > 0) {
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return { migrated: false, items: 0, packs: 0 };
    }

    const cards = await loadJson<LegacyCard[]>(LEGACY_CARDS_KEY, []);
    const decks = await loadJson<LegacyDeck[]>(LEGACY_DECKS_KEY, []);
    if (cards.length === 0 && decks.length === 0) {
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return { migrated: false, items: 0, packs: 0 };
    }

    const { items, packs } = migrateLegacy(cards, decks);
    await saveItems('truthOrDare', items);
    await savePacks('truthOrDare', packs);
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return { migrated: true, items: items.length, packs: packs.length };
  } catch {
    // Never let a migration failure stop the app booting. The legacy keys are
    // untouched, so the next launch can try again.
    return { migrated: false, items: 0, packs: 0 };
  }
}
