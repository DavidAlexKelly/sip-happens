// src/data/ringData.ts
// ─────────────────────────────────────────────────────────────────────────────
// The Ring of Fire rule table — one entry per rank, verbatim from the classic
// rules.
//
// Two things the app does better than a physical deck, and the reason this
// mode is worth building:
//
//   1. It REMEMBERS the roles. Thumb Master (4), Question Master (Q) and Mate
//      (8) all persist "until the next one is picked", which is precisely what
//      a drunk table forgets. Those are marked with `role` below and tracked
//      in ringGame.ts.
//   2. It COUNTS the kings. The last King is the whole climax of the game, and
//      nobody ever remembers whether that was the third or the fourth.
//
// Drinks are deliberately QUALITATIVE here. The classic rules say "drink",
// not "drink 2", so there is no arithmetic and the Sip Intensity stepper has
// no effect in this mode — same as Word Traitors. Inventing numbers would
// make it a different game.
//
// No React Native imports, so tools/ring-smoke.ts can execute all of it.
// ─────────────────────────────────────────────────────────────────────────────

import { Colors } from '../styles/theme';
import { RANKS, rankName } from './playingCards';
import { pickOne } from '../utils/random';

/** A role that one player holds until the next card of the same rank. */
export type RingRole = 'thumbMaster' | 'questionMaster' | 'mate';

/** Extra input the screen must collect before the turn can end. */
export type RingPrompt = 'category' | 'rhyme' | 'mate' | 'houseRule';

export interface RingRule {
  /** 1 = Ace (low) … 13 = King. */
  rank: number;
  /** Short headline, e.g. "WATERFALL". */
  title: string;
  /** The rule itself, as written. */
  instruction: string;
  /** Ionicons glyph. */
  icon: string;
  /** Accent colour — theme token, never raw hex. */
  color: string;
  /** Set when drawing this card hands someone a lasting role. */
  role?: RingRole;
  /** Set when the card asks the screen for something. */
  prompt?: RingPrompt;
  /** Kings add to the glass in the middle. */
  pours?: boolean;
}

export const RING_RULES: RingRule[] = [
  {
    rank: 1,
    title: 'WATERFALL',
    instruction:
      'You start drinking. The player to your left starts when you start, and so on round the circle. Nobody may stop until the person before them stops.',
    icon: 'water',
    color: Colors.tertiary,
  },
  {
    rank: 2,
    title: 'YOU',
    instruction: 'Nominate someone to drink.',
    icon: 'hand-right',
    color: Colors.orange,
  },
  {
    rank: 3,
    title: 'ME',
    instruction: 'That is you. You have to drink.',
    icon: 'person',
    color: Colors.secondary,
  },
  {
    rank: 4,
    title: 'THUMB MASTER',
    instruction:
      'You are the Thumb Master until the next 4 is drawn. Put your thumb on the table whenever you like — everyone must copy you, and the last one to do it drinks.',
    icon: 'thumbs-up',
    color: Colors.sky,
    role: 'thumbMaster',
  },
  {
    rank: 5,
    title: 'GUYS',
    instruction: 'All the guys drink.',
    icon: 'man',
    color: Colors.sky,
  },
  {
    rank: 6,
    title: 'CHICKS',
    instruction: 'All the women drink.',
    icon: 'woman',
    color: Colors.secondary,
  },
  {
    rank: 7,
    title: 'HEAVEN',
    instruction: 'Point to the heavens. The last person to do it drinks.',
    icon: 'arrow-up',
    color: Colors.primary,
  },
  {
    rank: 8,
    title: 'MATE',
    instruction:
      'Pick a mate. They drink whenever you drink, and you drink whenever they do — until the next 8 is drawn.',
    icon: 'people',
    color: Colors.lime,
    role: 'mate',
    prompt: 'mate',
  },
  {
    rank: 9,
    title: 'RHYME',
    instruction:
      'Say a word. The player to your left must rhyme with it, then the next, and so on. First to stumble or hesitate drinks.',
    icon: 'musical-notes',
    color: Colors.grape,
    prompt: 'rhyme',
  },
  {
    rank: 10,
    title: 'CATEGORIES',
    instruction:
      'Choose a category. Go round the circle naming something in it. First to repeat or hesitate drinks.',
    icon: 'list',
    color: Colors.tertiary,
    prompt: 'category',
  },
  {
    rank: 11,
    title: 'MAKE A RULE',
    instruction:
      'The ultimate card. Make a rule and everyone must obey it for the rest of the game. Break it and you drink.',
    icon: 'construct',
    color: Colors.primary,
    prompt: 'houseRule',
  },
  {
    rank: 12,
    title: 'QUESTION MASTER',
    instruction:
      'You are the Question Master until the next Queen is drawn. Anyone who answers a question you ask has to drink.',
    icon: 'help-circle',
    color: Colors.grape,
    role: 'questionMaster',
  },
  {
    rank: 13,
    title: 'POUR',
    instruction:
      'Pour some of your drink into the glass in the middle. Whoever draws the last King has to drink all of it.',
    icon: 'beer',
    color: Colors.error,
    pours: true,
  },
];

const RULES_BY_RANK: Map<number, RingRule> = new Map(
  RING_RULES.map(r => [r.rank, r]),
);

export function ruleForRank(rank: number): RingRule {
  const rule = RULES_BY_RANK.get(rank);
  if (!rule) {
    // Can't happen with a standard deck, but a missing rule would silently
    // skip a turn, so fail loudly rather than render a blank card.
    throw new Error(`No Ring of Fire rule defined for rank ${rank}`);
  }
  return rule;
}

/** "Jack — Make a Rule", for the card header. */
export function ruleHeading(rule: RingRule): string {
  return `${rankName(rule.rank)} — ${titleCase(rule.title)}`;
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

/** There must be exactly one rule per rank — asserted by the smoke test. */
export const RULE_RANKS: number[] = RANKS;

export const KINGS_IN_DECK = 4;

// ─────────────────────────────────────────────
// SUGGESTIONS
//
// The 9 and 10 cards need a starting word or category. Offering one removes
// the dead thirty seconds where nobody can think of anything.
// ─────────────────────────────────────────────

export const CATEGORY_SUGGESTIONS: string[] = [
  'lager brands', 'supermarkets', 'dog breeds', 'football clubs',
  'crisp flavours', 'Disney films', 'capital cities', 'fast food chains',
  'car makes', 'Marvel characters', 'cocktails', 'breakfast cereals',
  'things in this room', 'countries in Africa', 'rappers', 'board games',
  'pizza toppings', 'horror films', 'types of pasta', 'reality TV shows',
];

export const RHYME_STARTERS: string[] = [
  'cat', 'night', 'bell', 'train', 'moon', 'shame', 'clock', 'bright',
  'sand', 'gold', 'flame', 'crown', 'shoe', 'green', 'sour', 'line',
];

/** A suggestion for the prompt this rule asks for, or null if it asks nothing. */
export function suggestionFor(rule: RingRule): string | null {
  if (rule.prompt === 'category') return pickOne(CATEGORY_SUGGESTIONS);
  if (rule.prompt === 'rhyme') return pickOne(RHYME_STARTERS);
  return null;
}
