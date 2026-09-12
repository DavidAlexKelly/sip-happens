// src/data/ringSetStorage.ts
// Persistence for custom Ring of Fire rule sets.
//
// Separate from ringSets.ts for the same reason packStorage is separate from
// packs: importing AsyncStorage at the top level would make the rule-set logic
// impossible to require outside React Native, and that logic is the part worth
// testing.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLASSIC_SET, CLASSIC_SET_ID, RingRuleSet, validateRuleSet } from './ringSets';

const SETS_KEY = '@siphappens_ring_sets_v1';
const ACTIVE_KEY = '@siphappens_ring_active_set_v1';

/** Custom sets only — the classic set is code, not storage. */
export async function loadCustomSets(): Promise<RingRuleSet[]> {
  try {
    const raw = await AsyncStorage.getItem(SETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything corrupt rather than letting it reach the engine, where a
    // missing rank would throw mid-game.
    return (parsed as RingRuleSet[]).filter(
      s => s && typeof s.id === 'string' && Array.isArray(s.entries),
    );
  } catch {
    return [];
  }
}

export const saveCustomSets = (sets: RingRuleSet[]) =>
  AsyncStorage.setItem(SETS_KEY, JSON.stringify(sets.filter(s => !s.builtIn)));

/** Classic first, then the player's own. */
export async function loadAllSets(): Promise<RingRuleSet[]> {
  return [CLASSIC_SET, ...(await loadCustomSets())];
}

export async function loadActiveSetId(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(ACTIVE_KEY)) ?? CLASSIC_SET_ID;
  } catch {
    return CLASSIC_SET_ID;
  }
}

export const saveActiveSetId = (id: string) =>
  AsyncStorage.setItem(ACTIVE_KEY, id);

/**
 * The set to play with. Falls back to classic when the stored id is missing or
 * the set has become unplayable — an invalid set would throw on the first card
 * of a rank it has no rule for.
 */
export async function loadActiveSet(): Promise<RingRuleSet> {
  const [sets, activeId] = await Promise.all([loadAllSets(), loadActiveSetId()]);
  const found = sets.find(s => s.id === activeId);
  if (!found || validateRuleSet(found).length > 0) return CLASSIC_SET;
  return found;
}
