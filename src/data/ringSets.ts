// src/data/ringSets.ts
// Custom Ring of Fire rule sets: one rule per rank, freely re-assignable.
//
// A rank picks a MECHANIC from a fixed catalogue and supplies its own wording,
// icon and colour. The catalogue exists because the mechanics carry engine
// invariants that free-form rules would break:
//
//   • exactly ONE rank may `pour` — the engine counts pours to find the last
//     King, so two pouring ranks means eight "kings" and the ending breaks
//   • at most one rank per ROLE — "until the next 4 is drawn" is meaningless
//     if two ranks both hand out the Thumb Master
//
// validateRuleSet() enforces both, and the editor blocks saving a set that
// fails. Everything here is pure; tools/ring-smoke.ts covers it.

import { RING_RULES, RingPrompt, RingRole, RingRule } from './ringData';
import { RANKS } from './playingCards';
import { Colors } from '../styles/theme';

export type RingMechanic =
  | 'plain'
  | 'nominate'
  | 'selfDrink'
  | 'groupDrink'
  | 'waterfall'
  | 'roleThumb'
  | 'roleQuestion'
  | 'roleMate'
  | 'pour'
  | 'rhyme'
  | 'categories'
  | 'makeRule';

export interface MechanicSpec {
  id: RingMechanic;
  label: string;
  blurb: string;
  role?: RingRole;
  pours?: boolean;
  prompt?: RingPrompt;
  /** At most one rank may carry this mechanic. */
  unique?: boolean;
  /** Exactly one rank MUST carry this mechanic. */
  required?: boolean;
}

export const MECHANICS: MechanicSpec[] = [
  { id: 'plain', label: 'Just a rule', blurb: 'Whatever the text says. No special tracking.' },
  { id: 'nominate', label: 'Nominate', blurb: 'The drawer picks someone to drink.' },
  { id: 'selfDrink', label: 'You drink', blurb: 'The drawer drinks.' },
  { id: 'groupDrink', label: 'Group drinks', blurb: 'Everyone, or a named part of the group.' },
  { id: 'waterfall', label: 'Waterfall', blurb: 'Everyone drinks in sequence round the circle.' },
  {
    id: 'roleThumb', label: 'Thumb Master', unique: true, role: 'thumbMaster',
    blurb: 'Held until the next card of this rank. Tracked in the header.',
  },
  {
    id: 'roleQuestion', label: 'Question Master', unique: true, role: 'questionMaster',
    blurb: 'Held until the next card of this rank. Tracked in the header.',
  },
  {
    id: 'roleMate', label: 'Mate', unique: true, role: 'mate', prompt: 'mate',
    blurb: 'The drawer picks a partner, until the next card of this rank.',
  },
  {
    id: 'pour', label: 'Pour into the glass', unique: true, required: true, pours: true,
    blurb: 'Adds to the middle glass. The last one drawn drinks it — this is how the game ends.',
  },
  { id: 'rhyme', label: 'Rhyme', prompt: 'rhyme', blurb: 'Rhyme round the circle. Suggests a starting word.' },
  { id: 'categories', label: 'Categories', prompt: 'category', blurb: 'Name things in a category. Suggests one.' },
  { id: 'makeRule', label: 'Make a rule', prompt: 'houseRule', blurb: 'Adds a house rule everyone must obey.' },
];

const SPEC_BY_ID = new Map(MECHANICS.map(m => [m.id, m]));

export function mechanicSpec(id: RingMechanic): MechanicSpec {
  const spec = SPEC_BY_ID.get(id);
  if (!spec) throw new Error(`Unknown Ring of Fire mechanic: ${id}`);
  return spec;
}

export interface RingRuleEntry {
  rank: number;
  mechanic: RingMechanic;
  title: string;
  instruction: string;
  icon: string;
  color: string;
}

export interface RingRuleSet {
  id: string;
  name: string;
  /** Exactly one entry per rank 1–13. */
  entries: RingRuleEntry[];
  /** Built-in sets cannot be edited or deleted, only duplicated. */
  builtIn?: boolean;
}

// ─────────────────────────────────────────────
// THE CLASSIC SET
// ─────────────────────────────────────────────

/** Which mechanic each classic rank uses. */
const CLASSIC_MECHANICS: Record<number, RingMechanic> = {
  1: 'waterfall',
  2: 'nominate',
  3: 'selfDrink',
  4: 'roleThumb',
  5: 'groupDrink',
  6: 'groupDrink',
  7: 'groupDrink',
  8: 'roleMate',
  9: 'rhyme',
  10: 'categories',
  11: 'makeRule',
  12: 'roleQuestion',
  13: 'pour',
};

export const CLASSIC_SET_ID = 'classic';

export const CLASSIC_SET: RingRuleSet = {
  id: CLASSIC_SET_ID,
  name: 'Classic',
  builtIn: true,
  entries: RING_RULES.map(r => ({
    rank: r.rank,
    mechanic: CLASSIC_MECHANICS[r.rank],
    title: r.title,
    instruction: r.instruction,
    icon: r.icon,
    color: r.color,
  })),
};

// ─────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────

/** Problems with a set. Empty means it is safe to play. */
export function validateRuleSet(set: RingRuleSet): string[] {
  const problems: string[] = [];

  if (set.name.trim().length === 0) problems.push('The set needs a name.');

  const ranks = set.entries.map(e => e.rank);
  for (const rank of RANKS) {
    const n = ranks.filter(r => r === rank).length;
    if (n === 0) problems.push(`Rank ${rank} has no rule.`);
    if (n > 1) problems.push(`Rank ${rank} has ${n} rules.`);
  }

  for (const entry of set.entries) {
    if (!SPEC_BY_ID.has(entry.mechanic)) {
      problems.push(`Rank ${entry.rank} uses an unknown mechanic.`);
      continue;
    }
    if (entry.title.trim().length === 0) problems.push(`Rank ${entry.rank} needs a title.`);
    if (entry.instruction.trim().length < 8) {
      problems.push(`Rank ${entry.rank} needs a longer instruction.`);
    }
  }

  // The invariants the engine depends on.
  for (const spec of MECHANICS) {
    const uses = set.entries.filter(e => e.mechanic === spec.id).length;
    if (spec.required && uses === 0) {
      problems.push(`One rank must be "${spec.label}" — without it the game never ends.`);
    }
    if (spec.required && uses > 1) {
      problems.push(`Only one rank can be "${spec.label}" (${uses} are).`);
    }
    if (spec.unique && !spec.required && uses > 1) {
      problems.push(`Only one rank can be "${spec.label}" (${uses} are).`);
    }
  }

  return problems;
}

export const isPlayable = (set: RingRuleSet): boolean => validateRuleSet(set).length === 0;

// ─────────────────────────────────────────────
// RESOLUTION
// ─────────────────────────────────────────────

/**
 * The engine-facing rule for a rank. Behaviour flags come from the mechanic,
 * never from the rank number, which is what makes ranks re-assignable.
 */
export function resolveRule(set: RingRuleSet, rank: number): RingRule {
  const entry = set.entries.find(e => e.rank === rank);
  if (!entry) {
    // validateRuleSet blocks this; failing loudly beats a blank card.
    throw new Error(`Rule set "${set.name}" has no rule for rank ${rank}`);
  }
  const spec = mechanicSpec(entry.mechanic);
  return {
    rank: entry.rank,
    title: entry.title,
    instruction: entry.instruction,
    icon: entry.icon,
    color: entry.color,
    role: spec.role,
    prompt: spec.prompt,
    pours: spec.pours,
  };
}

/** A blank entry for a rank, used when adding a mechanic in the editor. */
export function entryFor(rank: number, mechanic: RingMechanic): RingRuleEntry {
  const spec = mechanicSpec(mechanic);
  return {
    rank,
    mechanic,
    title: spec.label.toUpperCase(),
    instruction: spec.blurb,
    icon: 'ellipse',
    color: Colors.primary,
  };
}

/** Copy a set under a new id and name, as an editable starting point. */
export function duplicateSet(set: RingRuleSet, id: string, name: string): RingRuleSet {
  return {
    id,
    name,
    builtIn: false,
    entries: set.entries.map(e => ({ ...e })),
  };
}

/** Replace one rank's entry. */
export function withEntry(set: RingRuleSet, entry: RingRuleEntry): RingRuleSet {
  return {
    ...set,
    entries: set.entries.map(e => (e.rank === entry.rank ? entry : e)),
  };
}
