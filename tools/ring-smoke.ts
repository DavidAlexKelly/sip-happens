// tools/ring-smoke.ts
// Behavioural checks for Ring of Fire. src/data/ringGame.ts is React-free, so
// these play whole games with a stacked deck.
//
//   npm test        (from the repo root — vitest reports one test per check)

import { suite } from '../tests/harness';
import { Card, RANKS, buildDeck } from '../src/data/playingCards';
import {
  KINGS_IN_DECK, RING_RULES, ruleForRank, suggestionFor,
  CATEGORY_SUGGESTIONS, RHYME_STARTERS,
} from '../src/data/ringData';
import {
  CLASSIC_SET, MECHANICS, RingRuleSet, duplicateSet, entryFor, isPlayable,
  mechanicSpec, resolveRule, validateRuleSet, withEntry,
} from '../src/data/ringSets';
import {
  RingConfig, RingState,
  addHouseRule, createGame, currentPlayer, drawCard, endGame, endsGame,
  isOver, kingsLeft, nextTurn, pickMate, summarise,
} from '../src/data/ringGame';

const check = suite('ring');

const players = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `P${i + 1}` }));

const cfg = (over: Partial<RingConfig> = {}): RingConfig => ({
  players: players(4),
  endOnLastKing: true,
  ...over,
});

/** A deck of exactly these ranks, in order, so tests are deterministic. */
const stack = (ranks: number[]): Card[] =>
  ranks.map((rank, i) => ({ rank, suit: 'spades', id: `${rank}-${i}` }));

/** Draw, then immediately pass on. */
const playOne = (s: RingState, c: RingConfig): RingState => nextTurn(drawCard(s, c), c);

check('exactly one rule per rank', RING_RULES.length === 13);
check('covers ranks 1-13',
  RANKS.every(r => RING_RULES.some(rule => rule.rank === r)));
check('no duplicate ranks',
  new Set(RING_RULES.map(r => r.rank)).size === 13);
check('every rule has a title and instruction',
  RING_RULES.every(r => r.title.length > 0 && r.instruction.trim().length > 10));
check('every instruction is a complete sentence',
  RING_RULES.every(r => /[.!]$/.test(r.instruction.trim())));
check('every rule has an icon and a colour',
  RING_RULES.every(r => r.icon.length > 0 && r.color.startsWith('#')));
check('ruleForRank throws on a rank that cannot exist', (() => {
  try { ruleForRank(14); return false; } catch { return true; }
})());
check('4 is the Thumb Master', ruleForRank(4).role === 'thumbMaster');
check('8 is Mate', ruleForRank(8).role === 'mate');
check('Queen is the Question Master', ruleForRank(12).role === 'questionMaster');
check('King pours', ruleForRank(13).pours === true);
check('only the King pours',
  RING_RULES.filter(r => r.pours).length === 1);
check('only three ranks carry a role',
  RING_RULES.filter(r => r.role).length === 3);
check('Jack asks for a house rule', ruleForRank(11).prompt === 'houseRule');
check('9 suggests a rhyme word',
  RHYME_STARTERS.includes(suggestionFor(ruleForRank(9))!));
check('10 suggests a category',
  CATEGORY_SUGGESTIONS.includes(suggestionFor(ruleForRank(10))!));
check('cards with no prompt suggest nothing',
  suggestionFor(ruleForRank(3)) === null);

{
  const c = cfg();
  let s = createGame(c, buildDeck());
  check('starts on draw', s.phase === 'draw');
  check('nothing face up yet', s.current === null);
  check('full deck', s.deck.length === 52);
  check('first turn is the first player', currentPlayer(s, c)!.name === 'P1');

  s = drawCard(s, c);
  check('drawing flips a card', s.phase === 'card' && s.current !== null);
  check('  → deck shrinks', s.deck.length === 51);
  check('  → card moves to the ring', s.drawn.length === 1);
  check('  → a rule is attached', s.currentRule !== null);
  check('drawing twice in a row is ignored',
    drawCard(s, c).deck.length === 51);

  s = nextTurn(s, c);
  check('turn passes clockwise', currentPlayer(s, c)!.name === 'P2');
  check('  → back to draw', s.phase === 'draw');
  check('  → table is cleared', s.current === null && s.currentRule === null);
  check('nextTurn before drawing is ignored', nextTurn(s, c).turnIndex === s.turnIndex);

  // Round the table and back.
  const c3 = cfg({ players: players(3) });
  let t = createGame(c3, buildDeck());
  const seen: string[] = [];
  for (let i = 0; i < 7; i++) { seen.push(currentPlayer(t, c3)!.name); t = playOne(t, c3); }
  check('order wraps correctly with 3 players',
    seen.join(',') === 'P1,P2,P3,P1,P2,P3,P1', seen.join(','));

  check('card conservation: ring + deck = 52',
    t.drawn.length + t.deck.length === 52);
}

{
  const c = cfg();
  // P1 draws a 4, P2 a blank, P3 a 4.
  let s = createGame(c, stack([4, 3, 4, 3]));
  check('no thumb master at the start', s.roles.thumbMasterId === null);

  s = drawCard(s, c);
  check('P1 becomes Thumb Master', s.roles.thumbMasterId === 1);
  s = nextTurn(s, c);
  s = drawCard(s, c);
  check('an unrelated card leaves the role alone', s.roles.thumbMasterId === 1);
  s = nextTurn(s, c);
  s = drawCard(s, c);
  check('the next 4 transfers it to P3', s.roles.thumbMasterId === 3);
}
{
  const c = cfg();
  let s = createGame(c, stack([12, 3, 12]));
  s = drawCard(s, c);
  check('P1 becomes Question Master', s.roles.questionMasterId === 1);
  s = playOne(s, c);
  s = drawCard(s, c);
  check('  → survives an unrelated card', s.roles.questionMasterId === 1);
  s = nextTurn(s, c);
  s = drawCard(s, c);
  check('the next Queen transfers it to P3', s.roles.questionMasterId === 3);
  check('thumb master is independent of question master',
    s.roles.thumbMasterId === null);
}

{
  const c = cfg();
  let s = createGame(c, stack([8, 3, 8]));
  s = drawCard(s, c);
  check('an 8 asks for a mate', s.awaitingMate);
  check('  → no pairing until one is picked', s.roles.mate === null);
  check('cannot pick yourself', pickMate(s, c, 1).roles.mate === null);
  check('cannot pick a non-player', pickMate(s, c, 99).roles.mate === null);

  s = pickMate(s, c, 3);
  check('pairing is recorded', s.roles.mate?.aId === 1 && s.roles.mate?.bId === 3);
  check('  → prompt cleared', !s.awaitingMate);
  check('picking again is ignored', pickMate(s, c, 4).roles.mate?.bId === 3);

  s = playOne(s, c);
  s = drawCard(s, c);
  check('pairing survives an unrelated card', s.roles.mate?.bId === 3);
  s = nextTurn(s, c);
  s = drawCard(s, c);
  check('a new 8 clears the old pairing immediately', s.roles.mate === null);
  check('  → and asks for a new one', s.awaitingMate);
}
{
  const solo = cfg({ players: players(1) });
  const s = drawCard(createGame(solo, stack([8])), solo);
  check('solo player is never asked to pick a mate', !s.awaitingMate);
}

{
  const c = cfg();
  let s = createGame(c, stack([13, 13, 13, 13]));
  check('four kings to come', kingsLeft(s) === KINGS_IN_DECK);

  s = drawCard(s, c);
  check('first king counted', s.kingsDrawn === 1);
  check('  → three left', kingsLeft(s) === 3);
  check('  → nobody drinks the glass yet', s.finalKingPlayerId === null);
  check('  → not the end', !endsGame(s, c));

  s = playOne(s, c);
  s = drawCard(s, c); // P2, king 2
  check('second king counted', s.kingsDrawn === 2);
  s = playOne(s, c);
  s = drawCard(s, c); // P3, king 3
  check('third king still not the end', !endsGame(s, c) && s.finalKingPlayerId === null);
  s = playOne(s, c);
  s = drawCard(s, c); // P4, king 4

  check('fourth king is the last king', s.kingsDrawn === 4 && kingsLeft(s) === 0);
  check('  → the drawer downs the glass', s.finalKingPlayerId === 4);
  check('  → this ends the game', endsGame(s, c));
  s = nextTurn(s, c);
  check('  → and the game is over', isOver(s));
}
{
  // endOnLastKing: false keeps playing past the fourth king.
  const c = cfg({ endOnLastKing: false });
  let s = createGame(c, stack([13, 13, 13, 13, 3, 3]));
  for (let i = 0; i < 4; i++) s = playOne(s, c);
  check('play-the-whole-deck: not over after four kings', !isOver(s));
  check('  → but the glass is still assigned', s.finalKingPlayerId === 4);
  s = playOne(s, c);
  check('  → keeps dealing', !isOver(s));
  s = drawCard(s, c);
  check('  → last card ends it', endsGame(s, c));
  check('  → over after passing on', isOver(nextTurn(s, c)));
}

{
  const c = cfg();
  let s = createGame(c, stack([11, 11, 3]));
  s = drawCard(s, c);
  check('Jack prompts for a rule', s.currentRule?.prompt === 'houseRule');
  s = addHouseRule(s, c, '  No first names  ');
  check('rule is stored and trimmed', s.houseRules[0].text === 'No first names');
  check('  → attributed to the drawer', s.houseRules[0].byPlayerId === 1);
  check('empty rules are ignored', addHouseRule(s, c, '   ').houseRules.length === 1);

  s = nextTurn(s, c);
  s = drawCard(s, c);
  s = addHouseRule(s, c, 'Drink with your left hand');
  check('rules accumulate', s.houseRules.length === 2);
  check('  → ids are unique',
    new Set(s.houseRules.map(r => r.id)).size === 2);
  s = playOne(s, c);
  check('rules survive later turns', s.houseRules.length === 2);
  check('cannot add a rule during the draw phase',
    addHouseRule(s, c, 'nope').houseRules.length === 2);
}

{
  const c = cfg();
  check('empty deck starts over', isOver(createGame(c, [])));
  check('no players starts over', isOver(createGame(cfg({ players: [] }), buildDeck())));

  let s = createGame(c, stack([13, 11, 4]));
  s = drawCard(s, c);
  s = playOne(s, c);
  s = addHouseRule(drawCard(s, c), c, 'Nicknames only');
  const sum = summarise(s);
  check('summary counts cards played', sum.cardsPlayed === 2);
  check('summary carries the kings', sum.kingsDrawn === 1);
  check('summary carries the house rules', sum.houseRules.length === 1);
  check('summary carries the roles', sum.roles.thumbMasterId === null);
  check('quit ends it', isOver(endGame(s)));
  check('drawing after the end is ignored', drawCard(endGame(s), c).phase === 'over');
}

{
  check('every mechanic has a label and blurb',
    MECHANICS.every(m => m.label.length > 0 && m.blurb.length > 10));
  check('mechanic ids are unique',
    new Set(MECHANICS.map(m => m.id)).size === MECHANICS.length);
  check('exactly one mechanic is required', MECHANICS.filter(m => m.required).length === 1);
  check('the required one is pour', MECHANICS.find(m => m.required)!.id === 'pour');
  check('pour is the only pouring mechanic',
    MECHANICS.filter(m => m.pours).length === 1);
  check('three mechanics carry roles', MECHANICS.filter(m => m.role).length === 3);
  check('every role mechanic is unique-constrained',
    MECHANICS.filter(m => m.role).every(m => m.unique === true));
  check('mechanicSpec throws on nonsense', (() => {
    try { mechanicSpec('nope' as never); return false; } catch { return true; }
  })());
}

{
  check('has 13 entries', CLASSIC_SET.entries.length === 13);
  check('one per rank',
    RANKS.every(r => CLASSIC_SET.entries.filter(e => e.rank === r).length === 1));
  check('is marked built-in', CLASSIC_SET.builtIn === true);
  check('VALIDATES CLEAN', validateRuleSet(CLASSIC_SET).length === 0,
    validateRuleSet(CLASSIC_SET).join(' | '));
  check('is playable', isPlayable(CLASSIC_SET));
  check('the King pours', CLASSIC_SET.entries.find(e => e.rank === 13)!.mechanic === 'pour');
  check('the 4 is the thumb master',
    CLASSIC_SET.entries.find(e => e.rank === 4)!.mechanic === 'roleThumb');

  // Resolution must reproduce the hardcoded behaviour exactly.
  for (const rank of RANKS) {
    const resolved = resolveRule(CLASSIC_SET, rank);
    const original = ruleForRank(rank);
    check(`rank ${rank}: resolves to the same behaviour as the static table`,
      resolved.pours === original.pours
      && resolved.role === original.role
      && resolved.prompt === original.prompt
      && resolved.title === original.title,
      `${JSON.stringify(resolved)} vs ${JSON.stringify(original)}`);
  }
}

{
  const custom = duplicateSet(CLASSIC_SET, 'mine', 'Mine');
  check('a duplicate is editable', custom.builtIn === false);
  check('a duplicate still validates', validateRuleSet(custom).length === 0);
  check('a duplicate is a deep copy',
    custom.entries !== CLASSIC_SET.entries && custom.entries[0] !== CLASSIC_SET.entries[0]);

  // Move pour off the King and onto the 7 — legal.
  let moved = withEntry(custom, entryFor(13, 'plain'));
  moved = withEntry(moved, entryFor(7, 'pour'));
  check('pour can be moved to another rank', validateRuleSet(moved).length === 0,
    validateRuleSet(moved).join(' | '));
  check('  → and the engine sees the 7 as pouring',
    resolveRule(moved, 7).pours === true);
  check('  → and the King as no longer pouring',
    resolveRule(moved, 13).pours !== true);

  // Removing pour entirely must be rejected: the game could never end.
  const noPour = withEntry(custom, entryFor(13, 'plain'));
  check('a set with NO pouring rank is rejected', validateRuleSet(noPour).length > 0);
  check('  → and says why',
    validateRuleSet(noPour).some(p => p.toLowerCase().includes('never ends')));

  // Two pouring ranks would give eight kings.
  const twoPours = withEntry(custom, entryFor(7, 'pour'));
  check('two pouring ranks are rejected', validateRuleSet(twoPours).length > 0);

  // Two thumb masters make the handover ambiguous.
  const twoThumbs = withEntry(custom, entryFor(7, 'roleThumb'));
  check('two thumb-master ranks are rejected', validateRuleSet(twoThumbs).length > 0);
  const twoMates = withEntry(custom, entryFor(7, 'roleMate'));
  check('two mate ranks are rejected', validateRuleSet(twoMates).length > 0);
  const twoQuestions = withEntry(custom, entryFor(7, 'roleQuestion'));
  check('two question-master ranks are rejected', validateRuleSet(twoQuestions).length > 0);

  // Unconstrained mechanics may repeat.
  let manyRhymes = withEntry(custom, entryFor(2, 'rhyme'));
  manyRhymes = withEntry(manyRhymes, entryFor(3, 'rhyme'));
  check('a mechanic with no constraint may repeat',
    validateRuleSet(manyRhymes).length === 0, validateRuleSet(manyRhymes).join(' | '));

  // Content problems.
  const blankTitle = withEntry(custom, { ...entryFor(5, 'plain'), title: '  ' });
  check('a blank title is rejected', validateRuleSet(blankTitle).length > 0);
  const shortText = withEntry(custom, { ...entryFor(5, 'plain'), instruction: 'go' });
  check('a too-short instruction is rejected', validateRuleSet(shortText).length > 0);
  const unnamed: RingRuleSet = { ...custom, name: '   ' };
  check('an unnamed set is rejected', validateRuleSet(unnamed).length > 0);

  // Missing / duplicated ranks.
  const missing: RingRuleSet = { ...custom, entries: custom.entries.filter(e => e.rank !== 6) };
  check('a missing rank is rejected', validateRuleSet(missing).length > 0);
  const dupRank: RingRuleSet = { ...custom, entries: [...custom.entries, entryFor(6, 'plain')] };
  check('a duplicated rank is rejected', validateRuleSet(dupRank).length > 0);

  check('resolveRule throws rather than rendering a blank card',
    (() => { try { resolveRule(missing, 6); return false; } catch { return true; } })());
}

