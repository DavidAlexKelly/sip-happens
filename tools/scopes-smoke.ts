// tools/scopes-smoke.ts
// Checks the scope adapters: validation rules and form round-tripping.
//
// These matter because the adapters are what let ONE set of library screens
// serve three content types. If a round trip loses a field, editing an item
// silently destroys part of it.
//
//   npm test        (from the repo root — vitest reports one test per check)

import { suite } from '../tests/harness';
import {
  LIBRARY_SCOPES, LibraryScope, adapterFor, isLibraryScope,
} from '../src/data/scopes';
import { FormValues } from '../src/data/scopes/types';

const check = suite('scopes');

check('three library scopes', LIBRARY_SCOPES.length === 3);
check('ring is NOT a library scope', !isLibraryScope('ring'));
check('truthOrDare is', isLibraryScope('truthOrDare'));
for (const s of LIBRARY_SCOPES) {
  const a = adapterFor(s);
  check(`${s}: adapter reports its own scope`, a.scope === s);
  check(`${s}: has nouns`, a.itemNoun.length > 0 && a.packNoun.length > 0);
  check(`${s}: has fields`, a.fields.length > 0);
  check(`${s}: default pack icon and colour`,
    a.defaultPackIcon.length > 0 && a.defaultPackColor.startsWith('#'));
  check(`${s}: every field key is unique`,
    new Set(a.fields.map(f => f.key)).size === a.fields.length);
  check(`${s}: choice fields actually offer choices`,
    a.fields.filter(f => f.kind === 'choice').every(f => (f.choices?.length ?? 0) > 0));
  check(`${s}: emptyForm covers every field`,
    a.fields.every(f => f.key in a.emptyForm()));
  check(`${s}: a blank form is rejected`, a.validate(a.emptyForm()) !== null);
  check(`${s}: exposes built-ins`, a.builtins().length > 0);
  check(`${s}: built-in ids are unique`,
    new Set(a.builtins().map(b => b.id)).size === a.builtins().length);
  check(`${s}: built-ins all have titles`,
    a.builtins().every(b => b.title.trim().length > 0));
}

/** Fill a form, validate, store, reload, and confirm nothing was lost. */
function roundTrip(scope: LibraryScope, form: FormValues, label: string) {
  const a = adapterFor(scope);
  const err = a.validate(form);
  check(`${label}: passes validation`, err === null, err ?? '');
  if (err) return;
  const payload = a.payloadFromForm(form);
  const back = a.formFromPayload(payload);
  const again = a.payloadFromForm(back);
  check(`${label}: form -> payload -> form -> payload is stable`,
    JSON.stringify(payload) === JSON.stringify(again),
    `${JSON.stringify(payload)} vs ${JSON.stringify(again)}`);
  const d = a.describe(payload);
  check(`${label}: describes with a title`, d.title.trim().length > 0);
}

{
  const a = adapterFor('truthOrDare');
  roundTrip('truthOrDare', {
    title: 'Truth Bomb', text: '{player1} must confess something', action: 'Confess',
    category: 'truth',
  }, 'full card');
  roundTrip('truthOrDare', {
    title: '', text: '{player1} drinks {small} right now', action: '', category: 'other',
  }, 'minimal card');

  check('rejects empty text', a.validate({ ...a.emptyForm(), text: '' }) !== null);
  check('rejects a too-short challenge',
    a.validate({ ...a.emptyForm(), text: 'Drink' }) !== null);
  check('rejects an unbalanced token brace',
    a.validate({ ...a.emptyForm(), text: '{player1 must drink up now' }) !== null);
  check('accepts balanced tokens',
    a.validate({ ...a.emptyForm(), text: '{player1} and {player2} drink' }) === null);
  check('action defaults when blank',
    (a.payloadFromForm({ text: 'x'.repeat(10), action: '' }) as { action: string })
      .action === 'Do it');
  check('blank title is stored as undefined, not an empty string',
    (a.payloadFromForm({ text: 'x'.repeat(10), title: '' }) as { title?: string })
      .title === undefined);
  check('tolerates a legacy payload with no title or category',
    a.formFromPayload({ text: 'old', action: 'a' }).category === 'other');
  check('describe falls back to a derived title',
    a.describe({ text: 'everyone must drink now', action: 'a' }).title.length > 0);
}

{
  const a = adapterFor('trivia');
  roundTrip('trivia', {
    question: 'Which planet is closest to the sun?', type: 'multiple',
    answer: 'Mercury', distractor1: 'Venus', distractor2: 'Mars', distractor3: 'Jupiter',
    wedge: 'science', difficulty: '3',
  }, 'multiple choice');
  roundTrip('trivia', {
    question: 'The Pacific is the largest ocean.', type: 'boolean',
    answer: 'true', distractor1: '', distractor2: '', distractor3: '',
    wedge: 'geography', difficulty: '1',
  }, 'true/false');

  const base = {
    question: 'A perfectly fine question?', type: 'multiple', answer: 'Yes',
    distractor1: 'No', distractor2: 'Maybe', distractor3: 'Never',
    wedge: 'science', difficulty: '2',
  };
  check('rejects fewer than three distractors',
    a.validate({ ...base, distractor3: '' }) !== null);
  check('rejects a distractor equal to the answer',
    a.validate({ ...base, distractor2: 'yes' }) !== null);
  check('rejects duplicate distractors',
    a.validate({ ...base, distractor2: 'No' }) !== null);
  check('rejects a too-short question',
    a.validate({ ...base, question: 'Eh?' }) !== null);
  check('boolean needs True or False',
    a.validate({ ...base, type: 'boolean', answer: 'Mercury' }) !== null);
  check('boolean accepts lower-case true',
    a.validate({ ...base, type: 'boolean', answer: 'true' }) === null);

  const boolPayload = a.payloadFromForm({ ...base, type: 'boolean', answer: 'false' }) as
    { answer: string; distractors: string[] };
  check('boolean answer is normalised to True/False', boolPayload.answer === 'False');
  check('boolean gets exactly one distractor', boolPayload.distractors.length === 1);
  check('  → and it is the opposite', boolPayload.distractors[0] === 'True');

  const multi = a.payloadFromForm(base) as { distractors: string[] };
  check('multiple keeps three distractors', multi.distractors.length === 3);
  check('an unknown wedge falls back rather than corrupting',
    (a.payloadFromForm({ ...base, wedge: 'nonsense' }) as { wedge: string }).wedge !== 'nonsense');
  check('an unknown difficulty falls back to medium',
    (a.payloadFromForm({ ...base, difficulty: '9' }) as { difficulty: number }).difficulty === 2);
  check('tolerates a corrupt payload',
    a.formFromPayload({ question: 'q' }).type === 'multiple');
}

{
  const a = adapterFor('traitors');
  roundTrip('traitors', { word: 'Pizza', hint: 'Round' }, 'word + hint');

  check('rejects an empty word', a.validate({ word: '', hint: 'Round' }) !== null);
  check('rejects an empty hint', a.validate({ word: 'Pizza', hint: '' }) !== null);
  check('rejects hint identical to word',
    a.validate({ word: 'Pizza', hint: 'pizza' }) !== null);
  check('rejects a hint containing the word',
    a.validate({ word: 'Pizza', hint: 'Pizza slice' }) !== null);
  check('rejects a multi-word secret',
    a.validate({ word: 'Ice Cream', hint: 'Cold' }) !== null);
  check('accepts a sensible pair',
    a.validate({ word: 'Elephant', hint: 'Grey' }) === null);
  check('trims whitespace',
    (a.payloadFromForm({ word: '  Pizza ', hint: ' Round ' }) as { word: string })
      .word === 'Pizza');
  check('describe shows the hint',
    a.describe({ word: 'Pizza', hint: 'Round' }).subtitle.includes('Round'));
}

{
  check('Truth or Dare built-ins are grouped by mechanic',
    adapterFor('truthOrDare').builtins().every(b => (b.group ?? '').length > 0));
  check('Trivia built-ins are grouped by wedge',
    adapterFor('trivia').builtins().every(b => (b.group ?? '').length > 0));
  check('Traitors built-ins match the shipped pack size',
    adapterFor('traitors').builtins().length === 30);
}

