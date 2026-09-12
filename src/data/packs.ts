// src/data/packs.ts
// Generic content library shared by every mode that has customisable content.
//
// Replaces customDecks.ts, which hardcoded Truth-or-Dare concepts. The
// mix-and-match idea is unchanged — a pack's itemIds hold either a custom item
// id or a "builtin:<id>" reference — it is just no longer Truth-or-Dare only.
//
// Scopes are kept separate because the payloads are not interchangeable: a
// trivia question in a Truth or Dare deck would be meaningless.
//
// This module is PURE — no AsyncStorage, no React Native. That is what lets
// tools/packs-smoke.ts exercise the migration exhaustively, which matters
// because losing somebody's saved decks is the one irreversible risk here.
// All persistence lives in ./packStorage.ts.

export type PackScope = 'truthOrDare' | 'trivia' | 'traitors' | 'ring';

export const PACK_SCOPES: PackScope[] = ['truthOrDare', 'trivia', 'traitors', 'ring'];

/**
 * One unit of user-authored content. `payload` is whatever the owning mode
 * needs — a card, a question, a word, a rule set entry — and is validated by
 * that mode, not here.
 */
export interface CustomItem<P = unknown> {
  id: string;
  scope: PackScope;
  createdAt: number;
  payload: P;
}

/** A named, mixable collection of item references. */
export interface Pack {
  id: string;
  scope: PackScope;
  name: string;
  icon: string;
  color: string;
  /** Custom item ids and/or "builtin:<id>" references, in order. */
  itemIds: string[];
  createdAt: number;
}

// ─────────────────────────────────────────────
// BUILT-IN REFERENCES
// ─────────────────────────────────────────────

export const BUILTIN_PREFIX = 'builtin:';

export const builtinRef = (id: string): string => `${BUILTIN_PREFIX}${id}`;

export const isBuiltinRef = (ref: string): boolean => ref.startsWith(BUILTIN_PREFIX);

/** "builtin:drink-12" -> "drink-12". Returns null for a custom id. */
export function builtinIdOf(ref: string): string | null {
  return isBuiltinRef(ref) ? ref.slice(BUILTIN_PREFIX.length) : null;
}

// ─────────────────────────────────────────────
// IDS
// ─────────────────────────────────────────────

/**
 * Monotonic within a session and prefixed by scope, so ids from two scopes can
 * never collide even if both are stored in one place by accident.
 */
let lastStamp = 0;
export function newId(scope: PackScope, kind: 'item' | 'pack'): string {
  const now = Date.now();
  lastStamp = now > lastStamp ? now : lastStamp + 1;
  return `${scope}-${kind}-${lastStamp}`;
}

// ─────────────────────────────────────────────
// PURE OPERATIONS
// ─────────────────────────────────────────────

export function packsInScope(packs: Pack[], scope: PackScope): Pack[] {
  return packs.filter(p => p.scope === scope);
}

export function itemsInScope<P>(items: CustomItem<P>[], scope: PackScope): CustomItem<P>[] {
  return items.filter(i => i.scope === scope);
}

export function findPack(packs: Pack[], id: string): Pack | undefined {
  return packs.find(p => p.id === id);
}

export function upsertPack(packs: Pack[], pack: Pack): Pack[] {
  const i = packs.findIndex(p => p.id === pack.id);
  if (i === -1) return [...packs, pack];
  const next = [...packs];
  next[i] = pack;
  return next;
}

export function removePack(packs: Pack[], id: string): Pack[] {
  return packs.filter(p => p.id !== id);
}

export function upsertItem<P>(items: CustomItem<P>[], item: CustomItem<P>): CustomItem<P>[] {
  const i = items.findIndex(x => x.id === item.id);
  if (i === -1) return [...items, item];
  const next = [...items];
  next[i] = item;
  return next;
}

/**
 * Delete an item AND drop every reference to it. Leaving dangling references
 * behind is how a pack silently shrinks: buildPool skips unknown ids without
 * complaint, so the pack would still claim "12 cards" while drawing 11.
 */
export function removeItem<P>(
  items: CustomItem<P>[],
  packs: Pack[],
  itemId: string,
): { items: CustomItem<P>[]; packs: Pack[] } {
  return {
    items: items.filter(i => i.id !== itemId),
    packs: packs.map(p =>
      p.itemIds.includes(itemId)
        ? { ...p, itemIds: p.itemIds.filter(id => id !== itemId) }
        : p),
  };
}

/** Add a reference to a pack, ignoring duplicates. */
export function addToPack(pack: Pack, ref: string): Pack {
  if (pack.itemIds.includes(ref)) return pack;
  return { ...pack, itemIds: [...pack.itemIds, ref] };
}

export function removeFromPack(pack: Pack, ref: string): Pack {
  return { ...pack, itemIds: pack.itemIds.filter(id => id !== ref) };
}

export function toggleInPack(pack: Pack, ref: string): Pack {
  return pack.itemIds.includes(ref) ? removeFromPack(pack, ref) : addToPack(pack, ref);
}

/** References across the selected packs, de-duplicated, order preserved. */
export function collectRefs(packs: Pack[], selectedPackIds: string[]): string[] {
  const seen = new Set<string>();
  const refs: string[] = [];
  for (const packId of selectedPackIds) {
    const pack = findPack(packs, packId);
    if (!pack) continue;
    for (const ref of pack.itemIds) {
      if (seen.has(ref)) continue;
      seen.add(ref);
      refs.push(ref);
    }
  }
  return refs;
}

/**
 * Turn selected packs into a playable pool.
 *
 * Generic over the output type: each mode passes resolvers for its own two
 * cases. This is the generalisation of buildCustomPool() — same dedupe and
 * same tolerance of deleted items, no longer Truth-or-Dare specific.
 */
export function buildPool<P, T>(
  packs: Pack[],
  selectedPackIds: string[],
  items: CustomItem<P>[],
  resolve: {
    builtin: (builtinId: string) => T | undefined;
    custom: (item: CustomItem<P>) => T | undefined;
  },
): T[] {
  const itemById = new Map(items.map(i => [i.id, i]));
  const out: T[] = [];

  for (const ref of collectRefs(packs, selectedPackIds)) {
    const builtinId = builtinIdOf(ref);
    if (builtinId != null) {
      const resolved = resolve.builtin(builtinId);
      if (resolved !== undefined) out.push(resolved);
      continue;
    }
    const item = itemById.get(ref);
    if (!item) continue; // deleted after the pack referenced it
    const resolved = resolve.custom(item);
    if (resolved !== undefined) out.push(resolved);
  }
  return out;
}

/** How many of a pack's references still resolve to something real. */
export function livePackSize<P>(pack: Pack, items: CustomItem<P>[]): number {
  const ids = new Set(items.map(i => i.id));
  return pack.itemIds.filter(ref => isBuiltinRef(ref) || ids.has(ref)).length;
}

/** Split a mixed selection into built-in ids and pack ids. */
export function splitSelection(
  selected: string[],
  builtInIds: string[],
): { builtIn: string[]; packIds: string[] } {
  const known = new Set(builtInIds);
  return {
    builtIn: selected.filter(id => known.has(id)),
    packIds: selected.filter(id => !known.has(id)),
  };
}

// ─────────────────────────────────────────────
// LEGACY MIGRATION  (pure — see tools/packs-smoke.ts)
// ─────────────────────────────────────────────

/** The Truth-or-Dare shapes that shipped before packs existed. */
export interface LegacyCard {
  id: string;
  text: string;
  action: string;
  /** Optional: very old cards predate this field. */
  createdAt?: number;
  title?: string;
  category?: string;
}

export interface LegacyDeck {
  id: string;
  name: string;
  icon: string;
  color: string;
  cardIds: string[];
  /** Optional: very old decks predate this field. */
  createdAt?: number;
}

/** Payload for a Truth or Dare item once migrated. */
export interface TruthOrDarePayload {
  text: string;
  action: string;
  title?: string;
  category?: string;
}

/**
 * Convert the legacy @nekkit_* data into scoped items and packs.
 *
 * Pure on purpose: the risk in this whole change is losing somebody's decks,
 * and a pure function can be tested exhaustively. The caller does the reading
 * and writing, and deliberately does NOT delete the legacy keys, so a bad
 * migration is recoverable.
 */
export function migrateLegacy(
  cards: LegacyCard[],
  decks: LegacyDeck[],
): { items: CustomItem<TruthOrDarePayload>[]; packs: Pack[] } {
  const items: CustomItem<TruthOrDarePayload>[] = cards.map(c => ({
    id: c.id,
    scope: 'truthOrDare',
    createdAt: c.createdAt ?? 0,
    payload: {
      text: c.text,
      action: c.action,
      title: c.title,
      category: c.category,
    },
  }));

  // Ids are carried over unchanged, which is what keeps every deck's
  // references valid without rewriting them.
  const packs: Pack[] = decks.map(d => ({
    id: d.id,
    scope: 'truthOrDare',
    name: d.name,
    icon: d.icon,
    color: d.color,
    itemIds: [...d.cardIds],
    createdAt: d.createdAt ?? 0,
  }));

  return { items, packs };
}
