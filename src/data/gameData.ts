// src/data/gameData.ts
// ─────────────────────────────────────────────────────────────────────────────
// This file owns types, constants, and helper functions only.
// All card content lives in src/data/cards/*.json — edit those, not this file.
// ─────────────────────────────────────────────────────────────────────────────

import socialCards from './cards/social.json';
import truthCards  from './cards/truth.json';
import drinkCards  from './cards/drink.json';
import wildCards   from './cards/wild.json';
import spicyCards  from './cards/spicy.json';
import rulesData   from './cards/rules.json';
import wordBanks   from './cards/word_banks.json';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface Challenge {
  id: string;
  text: string;
  action: string;
  icon: string;
  intensity: 1 | 2 | 3;
  mode: string;
  isRule?: boolean;
  ruleId?: string;
}

export interface GameMode {
  id: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
  intensity: string;
  time: string;
}

interface RawCard {
  text: string;
  action: string;
  icon: string;
  intensity: 1 | 2 | 3;
}

interface RawRulePair {
  ruleId: string;
  start: RawCard;
  end: RawCard;
}

// ─────────────────────────────────────────────
// PENALTY SYSTEM
// ─────────────────────────────────────────────

export interface PenaltyContext {
  currentRound?: number;
  totalRounds?: number;
  intensity?: 1 | 2 | 3;
  mode?: string;
  multiplier?: number;
}

export const PENALTY = {
  sip:    1,
  small:  2,
  medium: 3,
  large:  4,
  max:    5,
  finish: 99,
} as const;

export function getPenalty(base: keyof typeof PENALTY, ctx: PenaltyContext = {}): number {
  const value = PENALTY[base];
  if (value === 99) return 99;
  return value * (ctx.multiplier ?? 1);
}

export function formatPenalty(count: number): string {
  if (count === 99) return 'finish your drink';
  return count === 1 ? '1 sip' : `${count} sips`;
}

// ─────────────────────────────────────────────
// MODES — no 'all' entry; mixing is handled by multi-select
// ─────────────────────────────────────────────

export const MODES: GameMode[] = [
  {
    id: 'social',
    label: 'SOCIAL',
    icon: 'people',
    color: '#ff7afb',
    desc: 'Perfect icebreaker. Lighthearted dares and casual questions to get the rhythm flowing.',
    intensity: 'Easy Vibes',
    time: '15-30 MIN',
  },
  {
    id: 'truth',
    label: 'TRUTH',
    icon: 'eye',
    color: '#ff7cba',
    desc: 'No hiding. Raw truths and personal confessions laid bare on the table.',
    intensity: 'Medium',
    time: '20-40 MIN',
  },
  {
    id: 'drink',
    label: 'DRINK',
    icon: 'wine',
    color: '#00fbfb',
    desc: 'Classic drinking prompts. Everyone who does X, takes a sip.',
    intensity: 'Medium',
    time: '20-40 MIN',
  },
  {
    id: 'wild',
    label: 'WILD 🔥',
    icon: 'flame',
    color: '#ff6e84',
    desc: 'No holds barred. Our most daring challenge set yet. 18+ only.',
    intensity: 'Intense',
    time: '30-60 MIN',
  },
  {
    id: 'spicy',
    label: 'SPICY 🌶️',
    icon: 'heart',
    color: '#ff4500',
    desc: 'Adults only. Explicit dares and confessions for the truly bold. 18+ strictly.',
    intensity: 'Very Intense',
    time: '20-40 MIN',
  },
];

// ─────────────────────────────────────────────
// BUILD CHALLENGE POOLS
// ─────────────────────────────────────────────

function buildPool(cards: RawCard[], mode: string, prefix: string): Challenge[] {
  return cards.map((c, i) => ({ ...c, mode, id: `${prefix}-${i}` }));
}

const pools: Record<string, Challenge[]> = {
  social: buildPool(socialCards as RawCard[], 'social', 'social'),
  truth:  buildPool(truthCards  as RawCard[], 'truth',  'truth'),
  drink:  buildPool(drinkCards  as RawCard[], 'drink',  'drink'),
  wild:   buildPool(wildCards   as RawCard[], 'wild',   'wild'),
  spicy:  buildPool(spicyCards  as RawCard[], 'spicy',  'spicy'),
};

export const ALL_CHALLENGES: Challenge[] = Object.values(pools).flat();

/**
 * Returns a merged pool from one or more mode ids.
 * Passing all mode ids is equivalent to the old 'all' behaviour.
 */
export function getChallengePool(modes: string[]): Challenge[] {
  if (modes.length === 0) return ALL_CHALLENGES;
  return modes.flatMap(m => pools[m] ?? []);
}

// ─────────────────────────────────────────────
// BUILD RULE POOLS
// ─────────────────────────────────────────────

export const ALL_RULE_STARTS: Challenge[] = (rulesData as RawRulePair[]).map((pair, i) => ({
  ...pair.start,
  mode: 'all',
  id: `rule-start-${i}`,
  isRule: true,
  ruleId: pair.ruleId,
}));

export const ALL_RULE_ENDS: Record<string, Challenge> = Object.fromEntries(
  (rulesData as RawRulePair[]).map((pair, i) => [
    pair.ruleId,
    {
      ...pair.end,
      mode: 'all',
      id: `rule-end-${i}`,
      isRule: false,
      ruleId: pair.ruleId,
    },
  ])
);

// ─────────────────────────────────────────────
// TOKEN SUBSTITUTION
// ─────────────────────────────────────────────

export function substituteTokens(
  text: string,
  players: { name: string }[],
  ctx: PenaltyContext = {}
): string {
  if (players.length === 0) return text;

  const banks = wordBanks as Record<string, Record<string, string[]>>;

  return text
    .replace(/{player1}/g, players[0].name)
    .replace(/{player2}/g, players.length > 1 ? players[1].name : players[0].name)
    .replace(/{sip}/g,    formatPenalty(getPenalty('sip',    ctx)))
    .replace(/{small}/g,  formatPenalty(getPenalty('small',  ctx)))
    .replace(/{medium}/g, formatPenalty(getPenalty('medium', ctx)))
    .replace(/{large}/g,  formatPenalty(getPenalty('large',  ctx)))
    .replace(/{max}/g,    formatPenalty(getPenalty('max',    ctx)))
    .replace(/\{(\w+)\}/g, (match, key) => {
      const bank = banks[key];
      if (!bank) return match;
      const list = bank[ctx.mode ?? 'default'] ?? bank['default'] ?? [];
      if (list.length === 0) return match;
      return list[Math.floor(Math.random() * list.length)];
    });
}