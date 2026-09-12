// src/data/scopes/trivia.ts
// Trivia questions. Validation mirrors ValidateTrivia.js so a user-authored
// question is held to exactly the same standard as the generated ones.

import { ALL_QUESTIONS } from '../triviaData';
import { CustomItem, Pack, buildPool } from '../packs';
import { TriviaQuestion } from '../trivia/types';
import { WEDGES, WEDGE_IDS, WedgeId } from '../trivia/types';
import { Colors } from '../../styles/theme';
import { BuiltinEntry, FormValues, ScopeAdapter } from './types';

export interface TriviaPayload {
  question: string;
  answer: string;
  distractors: string[];
  wedge: WedgeId;
  difficulty: 1 | 2 | 3;
  type: 'multiple' | 'boolean';
}

const DIFFICULTY_CHOICES = [
  { value: '1', label: 'Easy' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Hard' },
];

function asPayload(p: unknown): TriviaPayload {
  const o = (p ?? {}) as Partial<TriviaPayload>;
  const wedge = WEDGE_IDS.includes(o.wedge as WedgeId)
    ? (o.wedge as WedgeId)
    : WEDGE_IDS[0];
  const difficulty = o.difficulty === 1 || o.difficulty === 2 || o.difficulty === 3
    ? o.difficulty
    : 2;
  return {
    question: typeof o.question === 'string' ? o.question : '',
    answer: typeof o.answer === 'string' ? o.answer : '',
    distractors: Array.isArray(o.distractors) ? o.distractors.map(String) : [],
    wedge,
    difficulty,
    type: o.type === 'boolean' ? 'boolean' : 'multiple',
  };
}

/** True/False questions store one distractor — the opposite of the answer. */
const opposite = (answer: string) =>
  answer.trim().toLowerCase() === 'true' ? 'False' : 'True';

export const triviaAdapter: ScopeAdapter = {
  scope: 'trivia',
  itemNoun: 'Question',
  itemNounPlural: 'Questions',
  packNoun: 'Pack',
  packNounPlural: 'Packs',
  defaultPackIcon: 'bulb',
  defaultPackColor: Colors.tertiary,

  fields: [
    {
      key: 'question',
      label: 'Question',
      kind: 'longText',
      placeholder: 'Which planet is closest to the sun?',
      maxLength: 300,
      required: true,
    },
    {
      key: 'type',
      label: 'Type',
      kind: 'choice',
      choices: [
        { value: 'multiple', label: 'Multiple choice' },
        { value: 'boolean', label: 'True / False' },
      ],
    },
    {
      key: 'answer',
      label: 'Correct answer',
      kind: 'text',
      placeholder: 'Mercury',
      maxLength: 120,
      required: true,
      helper: 'For True/False, type True or False.',
    },
    {
      key: 'distractor1',
      label: 'Wrong answer 1',
      kind: 'text',
      placeholder: 'Venus',
      maxLength: 120,
    },
    {
      key: 'distractor2',
      label: 'Wrong answer 2',
      kind: 'text',
      placeholder: 'Mars',
      maxLength: 120,
    },
    {
      key: 'distractor3',
      label: 'Wrong answer 3',
      kind: 'text',
      placeholder: 'Jupiter',
      maxLength: 120,
    },
    {
      key: 'wedge',
      label: 'Wedge',
      kind: 'choice',
      choices: WEDGE_IDS.map(w => ({
        value: w,
        label: WEDGES[w].label,
        color: WEDGES[w].color,
      })),
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      kind: 'choice',
      choices: DIFFICULTY_CHOICES,
      helper: 'Harder questions cost more sips when missed.',
    },
  ],

  emptyForm: (): FormValues => ({
    question: '', type: 'multiple', answer: '',
    distractor1: '', distractor2: '', distractor3: '',
    wedge: WEDGE_IDS[0], difficulty: '2',
  }),

  validate: (form) => {
    const question = (form.question ?? '').trim();
    const answer = (form.answer ?? '').trim();
    if (question.length < 8) return 'The question is too short.';
    if (answer.length === 0) return 'The correct answer cannot be empty.';

    if ((form.type ?? 'multiple') === 'boolean') {
      const a = answer.toLowerCase();
      if (a !== 'true' && a !== 'false') {
        return 'For a True/False question the answer must be True or False.';
      }
      return null;
    }

    const ds = [form.distractor1, form.distractor2, form.distractor3]
      .map(d => (d ?? '').trim())
      .filter(d => d.length > 0);
    if (ds.length !== 3) return 'A multiple-choice question needs three wrong answers.';

    // Same rules ValidateTrivia.js enforces on the generated banks.
    const lower = ds.map(d => d.toLowerCase());
    if (lower.includes(answer.toLowerCase())) {
      return 'One of the wrong answers is the same as the correct one.';
    }
    if (new Set(lower).size !== 3) return 'The wrong answers must all differ.';
    return null;
  },

  payloadFromForm: (form): TriviaPayload => {
    const answer = (form.answer ?? '').trim();
    const type = (form.type ?? 'multiple') === 'boolean' ? 'boolean' : 'multiple';
    const distractors = type === 'boolean'
      ? [opposite(answer)]
      : [form.distractor1, form.distractor2, form.distractor3]
          .map(d => (d ?? '').trim())
          .filter(d => d.length > 0);
    const diff = Number(form.difficulty ?? '2');
    return {
      question: (form.question ?? '').trim(),
      answer: type === 'boolean'
        ? (answer.toLowerCase() === 'true' ? 'True' : 'False')
        : answer,
      distractors,
      wedge: (WEDGE_IDS.includes(form.wedge as WedgeId)
        ? form.wedge
        : WEDGE_IDS[0]) as WedgeId,
      difficulty: (diff === 1 || diff === 3 ? diff : 2) as 1 | 2 | 3,
      type,
    };
  },

  formFromPayload: (payload): FormValues => {
    const p = asPayload(payload);
    return {
      question: p.question,
      type: p.type,
      answer: p.answer,
      distractor1: p.type === 'multiple' ? (p.distractors[0] ?? '') : '',
      distractor2: p.type === 'multiple' ? (p.distractors[1] ?? '') : '',
      distractor3: p.type === 'multiple' ? (p.distractors[2] ?? '') : '',
      wedge: p.wedge,
      difficulty: String(p.difficulty),
    };
  },

  describe: (payload) => {
    const p = asPayload(payload);
    return {
      title: p.question,
      subtitle: `${WEDGES[p.wedge]?.label ?? p.wedge} · ${p.answer}`,
    };
  },

  builtins: (): BuiltinEntry[] =>
    ALL_QUESTIONS.map(q => ({
      id: q.id,
      title: q.question,
      subtitle: q.answer,
      group: WEDGES[q.wedge]?.label ?? q.wedge,
    })),
};

// ─────────────────────────────────────────────
// POOL BUILDING
// ─────────────────────────────────────────────

const builtinById = new Map(ALL_QUESTIONS.map(q => [q.id, q]));

/**
 * Selected packs -> playable questions.
 *
 * Custom ids are prefixed so they can never collide with a generated id in the
 * engine's used-question set, and built-in refs resolve to the original object
 * so the engine's dedupe still works when a question is also reachable from a
 * selected wedge.
 */
export function buildTriviaPool(
  packs: Pack[],
  selectedPackIds: string[],
  items: CustomItem[],
): TriviaQuestion[] {
  return buildPool<unknown, TriviaQuestion>(packs, selectedPackIds, items, {
    builtin: id => builtinById.get(id),
    custom: item => {
      const p = asPayload(item.payload);
      if (p.question.trim().length === 0 || p.answer.trim().length === 0) return undefined;
      const expected = p.type === 'boolean' ? 1 : 3;
      if (p.distractors.length !== expected) return undefined;
      return {
        id: `custom-${item.id}`,
        wedge: p.wedge,
        sourceCategory: 'Custom',
        type: p.type,
        difficulty: p.difficulty,
        question: p.question,
        answer: p.answer,
        distractors: p.distractors,
      };
    },
  });
}
