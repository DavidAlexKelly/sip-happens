// src/data/scopes/truthOrDare.ts
// Truth or Dare cards. Payload shape matches migrateLegacy's output exactly,
// so migrated cards edit as though they had always lived here.

import { ALL_CHALLENGES, Challenge } from '../gameData';
import { CustomItem, Pack, buildPool } from '../packs';
import { CARD_CATEGORIES, playMode } from './categories';
import { Colors, ModeColors, ModeLabels } from '../../styles/theme';
import { getCardTitle, titleFromText } from '../../utils/cardTitles';
import { BuiltinEntry, FormValues, ScopeAdapter } from './types';

export interface TruthOrDarePayload {
  text: string;
  action: string;
  title?: string;
  category?: string;
}

function asPayload(p: unknown): TruthOrDarePayload {
  const o = (p ?? {}) as Partial<TruthOrDarePayload>;
  return {
    text: typeof o.text === 'string' ? o.text : '',
    action: typeof o.action === 'string' ? o.action : '',
    title: typeof o.title === 'string' ? o.title : undefined,
    category: typeof o.category === 'string' ? o.category : undefined,
  };
}

export const truthOrDareAdapter: ScopeAdapter = {
  scope: 'truthOrDare',
  itemNoun: 'Card',
  itemNounPlural: 'Cards',
  packNoun: 'Deck',
  packNounPlural: 'Decks',
  defaultPackIcon: 'layers',
  defaultPackColor: Colors.sky,

  fields: [
    {
      key: 'title',
      label: 'Title',
      kind: 'text',
      placeholder: 'e.g. Truth Bomb',
      maxLength: 40,
      helper: 'Leave blank and one is derived from the text.',
    },
    {
      key: 'text',
      label: 'Challenge',
      kind: 'tokenText',
      placeholder: '{player1} has to…',
      maxLength: 300,
      required: true,
      helper: 'Tap a token to insert it.',
    },
    {
      key: 'action',
      label: 'Action label',
      kind: 'text',
      placeholder: 'Do it',
      maxLength: 30,
      helper: 'The small caption under the challenge.',
    },
    {
      key: 'category',
      label: 'Category',
      kind: 'choice',
      choices: CARD_CATEGORIES.map(c => ({
        value: c,
        label: ModeLabels[c] ?? c,
        color: ModeColors[c] ?? Colors.sky,
      })),
      helper: 'Drives the badge colour in game.',
    },
  ],

  emptyForm: (): FormValues => ({
    title: '', text: '', action: '', category: 'other',
  }),

  validate: (form) => {
    const text = (form.text ?? '').trim();
    if (text.length === 0) return 'The challenge text cannot be empty.';
    if (text.length < 8) return 'That challenge is too short to read well.';
    // Unbalanced braces mean a token will render literally in game.
    const open = (text.match(/\{/g) ?? []).length;
    const close = (text.match(/\}/g) ?? []).length;
    if (open !== close) return 'A {token} is missing a brace.';
    return null;
  },

  payloadFromForm: (form): TruthOrDarePayload => {
    const title = (form.title ?? '').trim();
    const action = (form.action ?? '').trim();
    const category = (form.category ?? '').trim();
    return {
      text: (form.text ?? '').trim(),
      action: action.length > 0 ? action : 'Do it',
      title: title.length > 0 ? title : undefined,
      category: category.length > 0 ? category : undefined,
    };
  },

  formFromPayload: (payload): FormValues => {
    const p = asPayload(payload);
    return {
      title: p.title ?? '',
      text: p.text,
      action: p.action,
      category: p.category ?? 'other',
    };
  },

  describe: (payload) => {
    const p = asPayload(payload);
    return {
      title: getCardTitle({ title: p.title, text: p.text }),
      subtitle: p.text,
    };
  },

  builtins: (): BuiltinEntry[] =>
    ALL_CHALLENGES.map(c => ({
      id: c.id,
      title: titleFromText(c.text),
      subtitle: c.text,
      group: ModeLabels[c.mode] ?? c.mode,
    })),
};

// ─────────────────────────────────────────────
// POOL BUILDING
// ─────────────────────────────────────────────

const builtinById = new Map(ALL_CHALLENGES.map(c => [c.id, c]));

/**
 * Selected packs -> playable Challenges. Replaces buildCustomPool().
 *
 * Two behaviours carried over deliberately:
 *   • custom items get a `custom-` id prefix so they can never collide with a
 *     built-in id inside the engine's used-card set
 *   • built-in references resolve to the ORIGINAL challenge object, so the
 *     engine's dedupe still prevents seeing a card twice when it is also
 *     drawable from a selected built-in deck
 */
export function buildTruthOrDarePool(
  packs: Pack[],
  selectedPackIds: string[],
  items: CustomItem[],
): Challenge[] {
  return buildPool<unknown, Challenge>(packs, selectedPackIds, items, {
    builtin: id => builtinById.get(id),
    custom: item => {
      const p = asPayload(item.payload);
      if (p.text.trim().length === 0) return undefined;
      return {
        id: `custom-${item.id}`,
        text: p.text,
        action: p.action || 'Do it',
        icon: 'sparkles',
        intensity: 2,
        mode: playMode(p.category),
      } as Challenge;
    },
  });
}
