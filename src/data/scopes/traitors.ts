// src/data/scopes/traitors.ts
// Word Traitors words. Validation mirrors ValidateTraitors.js — in particular
// a hint must not contain its own word, which is the failure that actually
// ruins a round.

import { TraitorWord, WORDS } from '../traitorsData';
import { CustomItem, Pack, buildPool } from '../packs';
import { Colors } from '../../styles/theme';
import { BuiltinEntry, FormValues, ScopeAdapter } from './types';

export interface TraitorsPayload {
  word: string;
  hint: string;
}

function asPayload(p: unknown): TraitorsPayload {
  const o = (p ?? {}) as Partial<TraitorsPayload>;
  return {
    word: typeof o.word === 'string' ? o.word : '',
    hint: typeof o.hint === 'string' ? o.hint : '',
  };
}

export const traitorsAdapter: ScopeAdapter = {
  scope: 'traitors',
  itemNoun: 'Word',
  itemNounPlural: 'Words',
  packNoun: 'Pack',
  packNounPlural: 'Packs',
  defaultPackIcon: 'eye-off',
  defaultPackColor: Colors.grape,

  fields: [
    {
      key: 'word',
      label: 'Secret word',
      kind: 'text',
      placeholder: 'Pizza',
      maxLength: 40,
      required: true,
      helper: 'What the innocents see.',
    },
    {
      key: 'hint',
      label: 'Traitor hint',
      kind: 'text',
      placeholder: 'Round',
      maxLength: 40,
      required: true,
      helper: 'One vague word. Must not give the answer away.',
    },
  ],

  emptyForm: (): FormValues => ({ word: '', hint: '' }),

  validate: (form) => {
    const word = (form.word ?? '').trim();
    const hint = (form.hint ?? '').trim();
    if (word.length === 0) return 'The secret word cannot be empty.';
    if (hint.length === 0) return 'The hint cannot be empty.';
    if (word.toLowerCase() === hint.toLowerCase()) {
      return 'The hint cannot be the word itself.';
    }
    // The check that matters: a hint containing the word hands the round over.
    if (hint.toLowerCase().includes(word.toLowerCase())) {
      return 'The hint contains the word — the traitor would guess instantly.';
    }
    if (word.includes(' ')) return 'Use a single word or a short phrase without spaces.';
    return null;
  },

  payloadFromForm: (form): TraitorsPayload => ({
    word: (form.word ?? '').trim(),
    hint: (form.hint ?? '').trim(),
  }),

  formFromPayload: (payload): FormValues => {
    const p = asPayload(payload);
    return { word: p.word, hint: p.hint };
  },

  describe: (payload) => {
    const p = asPayload(payload);
    return { title: p.word, subtitle: `hint: ${p.hint}` };
  },

  builtins: (): BuiltinEntry[] =>
    WORDS.map(w => ({ id: w.id, title: w.word, subtitle: `hint: ${w.hint}` })),
};

// ─────────────────────────────────────────────
// POOL BUILDING
// ─────────────────────────────────────────────

const builtinById = new Map(WORDS.map(w => [w.id, w]));

/** Selected packs -> playable words. */
export function buildTraitorsPool(
  packs: Pack[],
  selectedPackIds: string[],
  items: CustomItem[],
): TraitorWord[] {
  return buildPool<unknown, TraitorWord>(packs, selectedPackIds, items, {
    builtin: id => builtinById.get(id),
    custom: item => {
      const p = asPayload(item.payload);
      if (p.word.trim().length === 0 || p.hint.trim().length === 0) return undefined;
      return { id: `custom-${item.id}`, word: p.word, hint: p.hint };
    },
  });
}
